import { Injectable, Logger } from "@nestjs/common";
import {
  ExtractionResult,
  ParseResult,
  PropertyData,
  BuildingData,
  UnitData,
  FieldConfidence,
  FieldConfidenceMap,
} from "../interfaces/parser.interface";

@Injectable()
export class RegexParserService {
  private readonly logger = new Logger(RegexParserService.name);

  parse(text: string): ParseResult | null {
    try {
      const property = this.parseProperty(text);
      const buildings = this.parseBuildings(text);
      const units = this.parseUnits(text);

      const fieldConfidence = this.buildConfidence(property, buildings, units, text);
      const confidence = this.calculateConfidence(fieldConfidence);

      const result: ExtractionResult = { property, buildings, units, fieldConfidence };

      this.logger.log(`Regex parser: confidence ${confidence.toFixed(2)}, ${units.length} units`);
      return { data: result, confidence, method: "regex" };
    } catch (err) {
      this.logger.warn("Regex parser failed", err);
      return null;
    }
  }

  // ─── Property ───────────────────────────────────────────────────────────────

  private parseProperty(text: string): PropertyData {
    return {
      name: this.extract(text, [
        // „Name" in German quote marks
        /unter dem Namen\s*„([^"\n]+)/i,
        /Bezeichnung[:\s]+„([^"\n]+)/i,
        /Objekt[:\s]+„([^"\n]+)/i,
        /Liegenschaft[:\s]+„([^"\n]+)/i,
      ]) || "",

      number: this.extract(text, [
        /Objektnummer\s+([A-Z0-9./-]+)/i,
        /Objekt[-\s]?(?:Nr|Nummer)[.:\s]+([A-Z0-9./-]+)/i,
        /Nr\.[:\s]+([A-Z0-9./-]+)/i,
      ]) || "",

      managementType: /Mietverwaltung|Verwaltungstyp\s+MV\b/i.test(text) ? "MV" : "WEG",

      propertyManager: this.extractCompany(text, [
        // "ward bestellt „CompanyName Musterstraße"  →  stop before street
        /ward bestellt\s*„+([^,\n"„]+?)(?=\s+\w+(?:straße|allee|weg|platz|gasse|damm|ring|chaussee)\b|\s*,)/i,
        /(?:Verwalter|Hausverwaltung)[:\s]+„([^,\n"„]+)/i,
      ]) || "",

      accountant: this.extract(text, [
        // closing quote may appear before the street; capture up to the quote then match street
        /beauftragt\s*„+([^„"\n]+)[""]?\s+\w+(?:straße|allee|weg|platz|gasse|damm|ring|chaussee)/i,
        /(?:Buchhalter|Buchf[üu]hrung|Steuerberatung|Wirtschaftspr[üu]fer)[:\s]+(.+?)(?:\n|$)/i,
      ]) || "",
    };
  }

  // ─── Buildings ──────────────────────────────────────────────────────────────

  private parseBuildings(text: string): BuildingData[] {
    const buildings: BuildingData[] = [];

    // Find "(\d+) Gebäude \d+ (Name)" section headers
    const headerPattern = /\(\d+\)\s*Geb[äa]ude\s+\d+\s*\(([^)]+)\)/gi;
    const matches = [...text.matchAll(headerPattern)];

    for (let i = 0; i < matches.length; i++) {
      const buildingName = matches[i][1].trim();
      const start = matches[i].index!;
      const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
      const section = text.substring(start, end);

      // "an der Adresse Street HouseNum, ZIP City"
      const addrMatch = section.match(
        /an der Adresse\s+([A-Za-zäöüÄÖÜß\s-]+?)\s+(\d+[a-z]?),\s*(\d{5})\s+([A-Za-zäöüÄÖÜß-]+)/i,
      );

      const yearMatch = section.match(/Baujahr\s+(\d{4})/i);

      // "Erdgeschoss bis N Obergeschoss" → floors = N + 1
      const floorsMatch = section.match(/Erdgeschoss\s+(?:bis|brs)\s+(\d+)\s+Obergeschoss/i);

      buildings.push({
        name: buildingName,
        street: addrMatch?.[1]?.trim() || "",
        houseNumber: addrMatch?.[2] || "",
        zipCode: addrMatch?.[3] || "",
        city: addrMatch?.[4]?.trim() || "",
        constructionYear: yearMatch ? parseInt(yearMatch[1]) : 0,
        floors: floorsMatch ? parseInt(floorsMatch[1]) + 1 : 0,
      });
    }

    // Fallback: find addresses directly if no building sections found
    if (buildings.length === 0) {
      const addressPattern =
        /an der Adresse\s+([A-Za-zäöüÄÖÜß\s-]+?)\s+(\d+[a-z]?),\s*(\d{5})\s+([A-Za-zäöüÄÖÜß-]+)/gi;
      const seen = new Set<string>();
      for (const m of text.matchAll(addressPattern)) {
        const key = `${m[1].trim()}|${m[2]}`;
        if (!seen.has(key)) {
          seen.add(key);
          buildings.push({
            name: `${m[1].trim()} ${m[2]}`,
            street: m[1].trim(),
            houseNumber: m[2],
            zipCode: m[3],
            city: m[4].trim(),
            constructionYear: 0,
            floors: 0,
          });
        }
      }
    }

    return buildings;
  }

  // ─── Units ──────────────────────────────────────────────────────────────────

  private parseUnits(text: string): UnitData[] {
    const units: UnitData[] = [];

    // Match numbered unit block headers: "N. Einheit(en) Nr. XX (Type)"
    // Allow { or ( as opening bracket (OCR sometimes produces { instead of ()
    const headerRe = /\n\d+[.,]\s+Einheit(?:en)?\s+Nr[.,]\s+([\d\s]+?(?:\s+bis\s+\d+)?)\s*[({]([^)}\n]+)[)}]/gi;

    interface Block { numberStr: string; typeStr: string; start: number }
    const blocks: Block[] = [];
    let m: RegExpExecArray | null;
    while ((m = headerRe.exec(text)) !== null) {
      blocks.push({
        numberStr: m[1].trim(),
        typeStr: m[2].trim(),
        start: m.index + m[0].length,
      });
    }

    for (let i = 0; i < blocks.length; i++) {
      const { numberStr, typeStr } = blocks[i];
      const blockEnd = i + 1 < blocks.length ? blocks[i + 1].start : text.length;
      const block = text.substring(blocks[i].start, blockEnd);

      const type = this.mapUnitType(typeStr);

      // MEA: "von 110,0/1.000" or "von 110,0/1 000" or "von 108,0/1.,000" (OCR noise)
      const meaMatch = block.match(/von\s+([\d,.]+)\s*\/\s*(1[.,\s]*000)/i);
      const coOwnershipShare = meaMatch
        ? `${meaMatch[1].replace(",", ".")}/${meaMatch[2].replace(/[,\s]/g, "")}`
        : "";

      // Floor + Entrance from "Lage: X, Eingang Y"
      // Use word boundary \b to avoid matching "Außenanlage" (contains "lage")
      const lageLine = (block.match(/\bLage[:\s]+([^\n•]+)/i)?.[1] || "").trim();
      const lageParts = lageLine.split(",");
      const floor = this.normalizeFloor(lageParts[0]?.trim() || "");
      // "Emgang" is a common OCR variant of "Eingang"
      const entranceMatch = lageLine.match(/E\w{0,3}gang\s+([A-Z\d]+)/i);
      const entrance = entranceMatch?.[1] || "";

      // Size: "Größe: ca 95,00 m" (m² rendered as m? by OCR)
      const sizeMatch = block.match(/Größe[:\s]+(?:je\s+)?ca\s+([\d,.]+)\s*m/i);
      const sizeSqm = sizeMatch ? parseFloat(sizeMatch[1].replace(",", ".")) : 0;

      // Rooms (only for Apartment / Office)
      const roomsMatch = block.match(/Zimmer[:\s]+(\d+)\s*Zimmer/i);
      const rooms = type === "Apartment" || type === "Office"
        ? (roomsMatch ? parseInt(roomsMatch[1]) : null)
        : null;

      // Construction year
      const yearMatch = block.match(/Baujahr(?:\s+der\s+Einheit)?[:\s]+(\d{4})/i);
      const constructionYear = yearMatch ? parseInt(yearMatch[1]) : 0;

      // Expand ranges like "09 bis 13"
      const rangeMatch = numberStr.match(/(\d+)\s+bis\s+(\d+)/i);
      if (rangeMatch) {
        const from = parseInt(rangeMatch[1]);
        const to = parseInt(rangeMatch[2]);
        for (let j = from; j <= to; j++) {
          units.push({
            number: String(j).padStart(2, "0"),
            type, floor, entrance, sizeSqm, coOwnershipShare, constructionYear, rooms,
          });
        }
      } else {
        units.push({
          number: numberStr.padStart(2, "0"),
          type, floor, entrance, sizeSqm, coOwnershipShare, constructionYear, rooms,
        });
      }
    }

    return units;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private normalizeFloor(raw: string): string {
    if (/Untergeschoss|UG\b/i.test(raw)) return "UG";
    if (/Erdgeschoss|EG\b/i.test(raw)) return "EG";
    const ogMatch = raw.match(/(\d+)\s*Obergeschoss/i);
    if (ogMatch) return `${ogMatch[1]} OG`;
    return raw.substring(0, 30).trim();
  }

  private mapUnitType(raw: string): UnitData["type"] {
    if (/büro|office|gewerbe/i.test(raw)) return "Office";
    if (/garten|garden/i.test(raw)) return "Garden";
    if (/stellplatz|parkplatz|garage|tiefgarage|tg|parking/i.test(raw)) return "Parking";
    return "Apartment";
  }

  /** Extract first capture group, trim, strip trailing newlines. */
  private extract(text: string, patterns: RegExp[]): string {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) return match[1].trim().replace(/\n[\s\S]*/s, "").substring(0, 100);
    }
    return "";
  }

  /** Like extract() but also strips trailing address-like suffixes. */
  private extractCompany(text: string, patterns: RegExp[]): string {
    const raw = this.extract(text, patterns);
    // Remove trailing whitespace-word run that looks like a street number
    return raw.replace(/\s+\d+.*$/, "").trim();
  }

  // ─── Confidence ─────────────────────────────────────────────────────────────

  private buildConfidence(
    property: PropertyData,
    buildings: BuildingData[],
    units: UnitData[],
    _text: string,
  ): FieldConfidenceMap {
    const propConf = (v: string | number): FieldConfidence =>
      v && String(v).length > 0 ? "extracted" : "missing";

    return {
      property: {
        name: propConf(property.name),
        number: propConf(property.number),
        managementType: "extracted",
        propertyManager: propConf(property.propertyManager),
        accountant: propConf(property.accountant),
      },
      buildings: buildings.map((b) => ({
        name: propConf(b.name),
        street: propConf(b.street),
        houseNumber: propConf(b.houseNumber),
        zipCode: propConf(b.zipCode),
        city: propConf(b.city),
        constructionYear: b.constructionYear > 0 ? "extracted" : "missing",
        floors: b.floors > 0 ? "extracted" : "missing",
      })),
      units: units.map((u) => ({
        number: propConf(u.number),
        type: propConf(u.type),
        floor: u.floor ? "extracted" : "missing",
        entrance: u.entrance ? "extracted" : "missing",
        sizeSqm: u.sizeSqm > 0 ? "extracted" : "missing",
        coOwnershipShare: propConf(u.coOwnershipShare),
        constructionYear: u.constructionYear > 0 ? "extracted" : "missing",
        rooms: u.rooms !== null ? "extracted" : "missing",
      })),
    };
  }

  private calculateConfidence(conf: FieldConfidenceMap): number {
    const allFields: FieldConfidence[] = [
      ...Object.values(conf.property),
      ...conf.buildings.flatMap((b) => Object.values(b)),
      ...conf.units.flatMap((u) => Object.values(u)),
    ];

    if (allFields.length === 0) return 0;

    const extracted = allFields.filter((f) => f === "extracted").length;
    const inferred = allFields.filter((f) => f === "inferred").length;

    return (extracted + inferred * 0.5) / allFields.length;
  }
}
