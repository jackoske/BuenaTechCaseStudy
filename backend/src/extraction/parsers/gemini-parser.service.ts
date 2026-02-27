import { Injectable, Logger } from "@nestjs/common";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParseResult, ExtractionResult } from "../interfaces/parser.interface";

const EXTRACTION_PROMPT = `Extract property management data from this German Teilungserklärung document.

Return a JSON object with this exact structure:
{
  "property": { "name": "", "number": "", "managementType": "WEG", "propertyManager": "", "accountant": "" },
  "buildings": [{ "name": "", "street": "", "houseNumber": "", "zipCode": "", "city": "", "constructionYear": 0, "floors": 0 }],
  "units": [{ "number": "", "type": "Apartment", "floor": "", "entrance": "", "sizeSqm": 0, "coOwnershipShare": "", "constructionYear": 0, "rooms": null }]
}

Types: Apartment, Office, Garden, Parking. Garden/Parking have rooms: null.
Return ONLY valid JSON.`;

@Injectable()
export class GeminiParserService {
  private readonly logger = new Logger(GeminiParserService.name);
  private client: GoogleGenerativeAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  isAvailable(): boolean {
    return !!this.client;
  }

  async parse(text: string): Promise<ParseResult | null> {
    if (!this.client) {
      this.logger.warn("Gemini API key not set, skipping");
      return null;
    }

    try {
      const model = this.client.getGenerativeModel({ model: "gemini-2.5-flash" });
      const truncatedText = text.substring(0, 10000);

      const result = await model.generateContent([
        EXTRACTION_PROMPT,
        `\n\nDocument:\n${truncatedText}`,
      ]);

      const content = result.response.text().replace(/```json\n?|```/g, "").trim();
      const parsed = JSON.parse(content) as ExtractionResult;
      const confidence = this.scoreResult(parsed);
      const fieldConfidence = this.buildFieldConfidence(parsed);

      this.logger.log(`Gemini extraction: confidence ${confidence.toFixed(2)}, ${parsed.units?.length || 0} units`);

      return {
        data: { ...parsed, fieldConfidence },
        confidence,
        method: "gemini",
      };
    } catch (err) {
      this.logger.error("Gemini extraction failed", err);
      return null;
    }
  }

  private scoreResult(result: ExtractionResult): number {
    const prop = result.property || {};
    const fields = Object.values(prop).filter((v) => v && v !== "WEG").length;
    const total = 5;
    const unitBonus = Math.min((result.units?.length || 0) * 0.05, 0.3);
    return Math.min(fields / total + unitBonus, 1);
  }

  private buildFieldConfidence(result: ExtractionResult) {
    const conf = (v: unknown): "extracted" | "missing" => (v !== null && v !== undefined && v !== "" && v !== 0 ? "extracted" : "missing");

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
