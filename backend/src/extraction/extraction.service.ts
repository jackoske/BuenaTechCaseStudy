import { Injectable, Logger } from "@nestjs/common";
import { PdfReaderService } from "./parsers/pdf-reader.service";
import { RegexParserService } from "./parsers/regex-parser.service";
import { OpenAiParserService } from "./parsers/openai-parser.service";
import { GeminiParserService } from "./parsers/gemini-parser.service";
import { PrismaService } from "../prisma/prisma.service";
import { ParseResult } from "./interfaces/parser.interface";

const CONFIDENCE_THRESHOLD = 0.5;

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
    private readonly prisma: PrismaService,
  ) {}

  async extractFromPdf(buffer: Buffer): Promise<ExtractionResponse> {
    // Step 1: Extract text
    const text = await this.pdfReader.extractText(buffer);
    if (!text || text.length < 20) {
      return {
        extraction: null,
        extractionMethod: null,
        overallConfidence: 0,
        duplicates: [],
        error: "Could not extract text from PDF. Please enter details manually.",
      };
    }

    // Step 2: Try regex
    let result: ParseResult | null = this.regexParser.parse(text);

    // Step 3: If regex confidence too low, try OpenAI
    if (!result || result.confidence < CONFIDENCE_THRESHOLD) {
      this.logger.log(`Regex confidence ${result?.confidence.toFixed(2) || "N/A"}, trying OpenAI`);
      if (this.openAiParser.isAvailable()) {
        const openAiResult = await this.openAiParser.parse(text);
        if (openAiResult && openAiResult.confidence >= CONFIDENCE_THRESHOLD) {
          result = openAiResult;
        }
      }
    }

    // Step 4: If still low, try Gemini
    if (!result || result.confidence < CONFIDENCE_THRESHOLD) {
      this.logger.log(`Trying Gemini fallback`);
      if (this.geminiParser.isAvailable()) {
        const geminiResult = await this.geminiParser.parse(text);
        if (geminiResult) {
          result = geminiResult;
        }
      }
    }

    if (!result) {
      return {
        extraction: null,
        extractionMethod: null,
        overallConfidence: 0,
        duplicates: [],
        error: "Extraction unsuccessful. Please enter details manually.",
      };
    }

    // Step 5: Duplicate detection
    const duplicates = await this.checkDuplicates(result);

    return {
      extraction: result.data,
      extractionMethod: result.method,
      overallConfidence: result.confidence,
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

      // Exact: property number matches
      if (property.number && existing.number === property.number) {
        duplicates.push({ ...base, matchType: "exact" });
        continue;
      }

      // Potential: name similarity
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
