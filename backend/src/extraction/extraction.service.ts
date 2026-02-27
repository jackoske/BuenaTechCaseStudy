import { Injectable, Logger } from "@nestjs/common";
import { PdfReaderService } from "./parsers/pdf-reader.service";
import { RegexParserService } from "./parsers/regex-parser.service";
import { OpenAiParserService } from "./parsers/openai-parser.service";
import { GeminiParserService } from "./parsers/gemini-parser.service";
import { OllamaParserService } from "./parsers/ollama-parser.service";
import { PrismaService } from "../prisma/prisma.service";
import { ParseResult } from "./interfaces/parser.interface";

const CONFIDENCE_THRESHOLD = 0.5;
const TEXT_PDF_MIN_LENGTH = 200;

export type ExtractionMethod = "auto" | "regex" | "openai" | "gemini" | "ollama";

export interface DuplicateMatch {
  id: number;
  name: string;
  number: string;
  managementType: string;
  buildingCount: number;
  unitCount: number;
  matchType: "exact" | "potential";
}

export interface ExtractionResponse {
  extraction: ParseResult["data"] | null;
  extractionMethod: string | null;
  overallConfidence: number;
  isTextPdf: boolean;
  duplicates: DuplicateMatch[];
  error?: string;
}

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  constructor(
    private readonly pdfReader: PdfReaderService,
    private readonly regexParser: RegexParserService,
    private readonly openAiParser: OpenAiParserService,
    private readonly geminiParser: GeminiParserService,
    private readonly ollamaParser: OllamaParserService,
    private readonly prisma: PrismaService,
  ) {}

  async extractFromPdf(buffer: Buffer, method: ExtractionMethod = "auto"): Promise<ExtractionResponse> {
    // Step 1: Extract text
    const text = await this.pdfReader.extractText(buffer);
    const isTextPdf = text.length >= TEXT_PDF_MIN_LENGTH;

    // Step 2: Run the selected parser (or auto-fallback chain)
    let result: ParseResult | null = null;

    // Scanned PDFs: only Gemini Vision can handle them (sends raw PDF bytes)
    if (!isTextPdf) {
      const canUseGemini =
        this.geminiParser.isAvailable() &&
        (method === "auto" || method === "gemini");

      if (!canUseGemini) {
        return {
          extraction: null,
          extractionMethod: null,
          overallConfidence: 0,
          isTextPdf: false,
          duplicates: [],
          error:
            "Scanned / image-only PDF detected — no readable text found. " +
            (method === "regex" || method === "ollama" || method === "openai"
              ? "Switch to Gemini or Auto parser to process this PDF."
              : "Set GEMINI_API_KEY to enable AI vision extraction for scanned PDFs."),
        };
      }

      this.logger.log("Scanned PDF detected — sending to Gemini Vision");
      result = await this.geminiParser.parseBuffer(buffer);

      if (!result || result.confidence < CONFIDENCE_THRESHOLD) {
        return {
          extraction: null,
          extractionMethod: null,
          overallConfidence: 0,
          isTextPdf: false,
          duplicates: [],
          error: "Gemini Vision could not extract data from this scanned PDF. Please enter details manually.",
        };
      }

      const duplicates = await this.checkDuplicates(result);
      return {
        extraction: result.data,
        extractionMethod: result.method,
        overallConfidence: result.confidence,
        isTextPdf: false,
        duplicates,
      };
    }

    if (method === "regex") {
      result = this.regexParser.parse(text);
    } else if (method === "openai") {
      if (this.openAiParser.isAvailable()) {
        result = await this.openAiParser.parse(text);
      } else {
        return {
          extraction: null,
          extractionMethod: null,
          overallConfidence: 0,
          isTextPdf,
          duplicates: [],
          error: "OpenAI parser is not configured. Set OPENAI_API_KEY in backend/.env.",
        };
      }
    } else if (method === "gemini") {
      if (this.geminiParser.isAvailable()) {
        result = await this.geminiParser.parse(text);
      } else {
        return {
          extraction: null,
          extractionMethod: null,
          overallConfidence: 0,
          isTextPdf,
          duplicates: [],
          error: "Gemini parser is not configured. Set GEMINI_API_KEY in backend/.env.",
        };
      }
    } else if (method === "ollama") {
      if (this.ollamaParser.isAvailable()) {
        result = await this.ollamaParser.parse(text);
      } else {
        return {
          extraction: null,
          extractionMethod: null,
          overallConfidence: 0,
          isTextPdf,
          duplicates: [],
          error: "Ollama parser is not configured. Set OLLAMA_BASE_URL in backend/.env.",
        };
      }
    } else {
      // Auto fallback chain: regex → Gemini → Ollama (optional, local)
      // Note: OpenAI is wired up but not tested — no OPENAI_API_KEY available.
      //       Gemini is the primary AI fallback (set GEMINI_API_KEY in .env).
      //       Ollama is optional local AI (set OLLAMA_BASE_URL if running locally).
      result = this.regexParser.parse(text);
      this.logger.log(`Regex confidence: ${result?.confidence.toFixed(2) ?? "N/A"}`);

      if (!result || result.confidence < CONFIDENCE_THRESHOLD) {
        if (this.geminiParser.isAvailable()) {
          this.logger.log("Regex confidence below threshold, trying Gemini");
          const r = await this.geminiParser.parse(text);
          if (r && r.confidence >= CONFIDENCE_THRESHOLD) result = r;
        }
      }

      // Ollama: optional local AI fallback — only runs if OLLAMA_BASE_URL is set
      if (!result || result.confidence < CONFIDENCE_THRESHOLD) {
        if (this.ollamaParser.isAvailable()) {
          this.logger.log("Trying Ollama local AI fallback");
          const r = await this.ollamaParser.parse(text);
          if (r) result = r;
        }
      }

      if (!result || result.confidence < CONFIDENCE_THRESHOLD) {
        if (this.ollamaParser.isAvailable()) {
          this.logger.log("Trying Ollama fallback");
          const r = await this.ollamaParser.parse(text);
          if (r) result = r;
        }
      }
    }

    if (!result) {
      return {
        extraction: null,
        extractionMethod: null,
        overallConfidence: 0,
        isTextPdf,
        duplicates: [],
        error: "Extraction unsuccessful. Please enter details manually.",
      };
    }

    // Step 3: Duplicate detection
    const duplicates = await this.checkDuplicates(result);

    return {
      extraction: result.data,
      extractionMethod: result.method,
      overallConfidence: result.confidence,
      isTextPdf,
      duplicates,
    };
  }

  private async checkDuplicates(result: ParseResult): Promise<DuplicateMatch[]> {
    const { property } = result.data;
    const duplicates: DuplicateMatch[] = [];

    const properties = await this.prisma.property.findMany({
      include: {
        buildings: { include: { units: true } },
      },
    });

    for (const existing of properties) {
      const unitCount = existing.buildings.reduce((s, b) => s + b.units.length, 0);
      const base = {
        id: existing.id,
        name: existing.name,
        number: existing.number,
        managementType: existing.managementType,
        buildingCount: existing.buildings.length,
        unitCount,
      };

      if (property.number && existing.number === property.number) {
        duplicates.push({ ...base, matchType: "exact" });
        continue;
      }

      if (property.name && this.similarity(existing.name, property.name) > 0.7) {
        duplicates.push({ ...base, matchType: "potential" });
      }
    }

    return duplicates;
  }

  private similarity(a: string, b: string): number {
    const al = a.toLowerCase();
    const bl = b.toLowerCase();
    const longer = al.length > bl.length ? al : bl;
    const shorter = al.length > bl.length ? bl : al;
    if (longer.length === 0) return 1;
    return (longer.length - this.editDistance(longer, shorter)) / longer.length;
  }

  private editDistance(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }
}
