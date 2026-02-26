import { Injectable, Logger } from "@nestjs/common";
import { ParseResult, ExtractionResult } from "../interfaces/parser.interface";

const EXTRACTION_PROMPT = `You are a data extraction assistant. Extract property management data from this German Teilungserklärung (declaration of division) document.

Return a JSON object with this exact structure:
{
  "property": {
    "name": "property name",
    "number": "property number/ID",
    "managementType": "WEG" or "MV",
    "propertyManager": "name of property manager company",
    "accountant": "name of accountant/bookkeeper"
  },
  "buildings": [
    {
      "name": "building name",
      "street": "street name",
      "houseNumber": "house number",
      "zipCode": "5-digit zip",
      "city": "city name",
      "constructionYear": 2023,
      "floors": 5
    }
  ],
  "units": [
    {
      "number": "unit number",
      "type": "Apartment" or "Office" or "Garden" or "Parking",
      "floor": "floor designation (EG/1.OG/UG etc)",
      "entrance": "entrance letter/number",
      "sizeSqm": 95.0,
      "coOwnershipShare": "110/1000",
      "constructionYear": 2023,
      "rooms": 3
    }
  ]
}

For missing fields, use empty string "" for strings, 0 for numbers, null for nullable fields.
Units of type Garden or Parking should have rooms: null.
Return ONLY the JSON, no explanation.`;

@Injectable()
export class OllamaParserService {
  private readonly logger = new Logger(OllamaParserService.name);
  private readonly baseUrl: string | null;
  private readonly model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || null;
    this.model = process.env.OLLAMA_MODEL || "llama3.2";
  }

  isAvailable(): boolean {
    return !!this.baseUrl;
  }

  async parse(text: string): Promise<ParseResult | null> {
    if (!this.baseUrl) {
      this.logger.warn("Ollama base URL not set, skipping");
      return null;
    }

    try {
      const truncatedText = text.substring(0, 8000);

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: EXTRACTION_PROMPT },
            { role: "user", content: truncatedText },
          ],
          stream: false,
          format: "json",
        }),
        signal: AbortSignal.timeout(120000),
      });

      if (!response.ok) {
        throw new Error(`Ollama returned ${response.status}`);
      }

      const data = await response.json() as { message?: { content?: string } };
      const content = data?.message?.content;
      if (!content) return null;

      const parsed = JSON.parse(content) as ExtractionResult;
      const confidence = this.scoreResult(parsed);
      const fieldConfidence = this.buildFieldConfidence(parsed);

      this.logger.log(`Ollama extraction: confidence ${confidence.toFixed(2)}, ${parsed.units?.length || 0} units`);

      return {
        data: { ...parsed, fieldConfidence },
        confidence,
        method: "ollama",
      };
    } catch (err) {
      this.logger.error("Ollama extraction failed", err);
      return null;
    }
  }

  private scoreResult(result: ExtractionResult): number {
    let score = 0;
    let total = 0;

    const prop = result.property || {};
    const propFields = ["name", "number", "managementType", "propertyManager", "accountant"];
    for (const f of propFields) {
      total++;
      if (prop[f as keyof typeof prop]) score++;
    }

    for (const b of result.buildings || []) {
      const bFields = ["name", "street", "houseNumber", "zipCode", "city"];
      for (const f of bFields) {
        total++;
        if (b[f as keyof typeof b]) score++;
      }
    }

    for (const u of result.units || []) {
      const uFields = ["number", "type", "sizeSqm"];
      for (const f of uFields) {
        total++;
        if (u[f as keyof typeof u]) score++;
      }
    }

    return total > 0 ? score / total : 0;
  }

  private buildFieldConfidence(result: ExtractionResult) {
    const conf = (v: unknown): "extracted" | "missing" =>
      v !== null && v !== undefined && v !== "" && v !== 0 ? "extracted" : "missing";

    return {
      property: {
        name: conf(result.property?.name),
        number: conf(result.property?.number),
        managementType: conf(result.property?.managementType),
        propertyManager: conf(result.property?.propertyManager),
        accountant: conf(result.property?.accountant),
      },
      buildings: (result.buildings || []).map((b) => ({
        name: conf(b.name),
        street: conf(b.street),
        houseNumber: conf(b.houseNumber),
        zipCode: conf(b.zipCode),
        city: conf(b.city),
        constructionYear: conf(b.constructionYear),
        floors: conf(b.floors),
      })),
      units: (result.units || []).map((u) => ({
        number: conf(u.number),
        type: conf(u.type),
        floor: conf(u.floor),
        entrance: conf(u.entrance),
        sizeSqm: conf(u.sizeSqm),
        coOwnershipShare: conf(u.coOwnershipShare),
        constructionYear: conf(u.constructionYear),
        rooms: conf(u.rooms),
      })),
    };
  }
}
