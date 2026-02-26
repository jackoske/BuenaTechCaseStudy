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
      const units = this.parseUnits(text, buildings);

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

  private parseProperty(text: string): PropertyData {
    return {
      name: this.extract(text, [
        /Liegenschaft[:\s]+(.+)/i,
        /Objekt[:\s]+(.+)/i,
        /Grundst[üu]ck[:\s]+(.+)/i,
        /Bezeichnung[:\s]+(.+)/i,
      ]) || "",
      number: this.extract(text, [
        /(?:Objekt|Liegenschaft|Haus)[-\s]?(?:Nr|Nummer)[.:\s]+([A-Z0-9./-]+)/i,
        /Nr\.[:\s]+([A-Z0-9./-]+)/i,
      ]) || "",
      managementType: /Mietverwaltung|MV\b/i.test(text) ? "MV" : "WEG",
      propertyManager: this.extract(text, [
        /(?:Verwalter|Hausverwaltung|Verwaltung)[:\s]+(.+?)(?:\n|GmbH|AG|KG)/i,
        /Verwalter[:\s]+(.+)/i,
      ]) || "",
      accountant: this.extract(text, [
        /(?:Buchhalter|Buchf[üu]hrung|Steuerberatung|Wirtschaftspr[üu]fer)[:\s]+(.+)/i,
      ]) || "",
    };
  }

  private parseBuildings(text: string): BuildingData[] {
    const buildings: BuildingData[] = [];

    // Try to find address patterns
    const addressPattern = /([A-Za-zäöüÄÖÜß\s-]+(?:straße|gasse|weg|allee|platz|damm|ring|chaussee))\s+(\d+[a-z]?)/gi;
    const addressMatches = [...text.matchAll(addressPattern)];

    if (addressMatches.length === 0) {
      // Fallback: try generic street pattern
      const simplePattern = /Straße[:\s]+(.+?),?\s+(\d+)/gi;
      const simpleMatches = [...text.matchAll(simplePattern)];
      if (simpleMatches.length > 0) {
        const m = simpleMatches[0];
        buildings.push(this.buildBuildingFromMatch(m[1].trim(), m[2].trim(), text));
      }
    } else {
      const seen = new Set<string>();
      for (const m of addressMatches.slice(0, 5)) {
        const key = `${m[1].trim()}|${m[2].trim()}`;
        if (!seen.has(key)) {
          seen.add(key);
          buildings.push(this.buildBuildingFromMatch(m[1].trim(), m[2].trim(), text));
        }
      }
    }

    return buildings;
  }

  private buildBuildingFromMatch(street: string, houseNumber: string, text: string): BuildingData {
    const zipCityPattern = /(\d{5})\s+([A-Za-zäöüÄÖÜß\s-]+)/;
    const zipCityMatch = text.match(zipCityPattern);

    const yearPattern = /Baujahr[:\s]+(\d{4})|Errichtungsjahr[:\s]+(\d{4})/i;
    const yearMatch = text.match(yearPattern);

    const floorsPattern = /(?:Stockwerke|Etagen|Geschosse)[:\s]+(\d+)/i;
    const floorsMatch = text.match(floorsPattern);

    return {
      name: `${street} ${houseNumber}`,
      street,
      houseNumber,
      zipCode: zipCityMatch?.[1] || "",
      city: zipCityMatch?.[2]?.trim() || "",
      constructionYear: yearMatch ? parseInt(yearMatch[1] || yearMatch[2]) : 0,
      floors: floorsMatch ? parseInt(floorsMatch[1]) : 0,
    };
  }

  private parseUnits(text: string, buildings: BuildingData[]): UnitData[] {
    const units: UnitData[] = [];
    const buildingRef = buildings[0]?.name || "";

    // Pattern for unit tables in Teilungserklärung
    const unitPattern = /(?:Nr\.|Einheit|Wohneinheit|Einh\.)\s*(\d+[a-z]?)[\s\t]+(?:(Wohnung|Büro|Garten|Stellplatz|Parkplatz|TG)[\s\t]+)?(\d+[.,]\d+)\s*m²/gi;
    const matches = [...text.matchAll(unitPattern)];

    for (const match of matches) {
      const typeRaw = match[2]?.toLowerCase() || "";
      units.push({
        number: match[1],
        type: this.mapUnitType(typeRaw),
        floor: "",
        entrance: "",
        sizeSqm: parseFloat(match[3].replace(",", ".")),
        coOwnershipShare: "",
        constructionYear: 0,
        rooms: null,
      });
    }

    // Also try MEA pattern: "1/1000"
    if (units.length === 0) {
      const meaPattern = /(\d+[a-z]?)\s+(\d+[.,]\d+)\s*m²\s+([\d/]+)\s*(?:MEA|Tausendstel)/gi;
      for (const match of [...text.matchAll(meaPattern)]) {
        units.push({
          number: match[1],
          type: "Apartment",
          floor: "",
          entrance: "",
          sizeSqm: parseFloat(match[2].replace(",", ".")),
          coOwnershipShare: match[3],
          constructionYear: 0,
          rooms: null,
        });
      }
    }

    return units;
  }

  private mapUnitType(raw: string): UnitData["type"] {
    if (/büro|office/i.test(raw)) return "Office";
    if (/garten/i.test(raw)) return "Garden";
    if (/stellplatz|parkplatz|garage|tiefgarage|tg/i.test(raw)) return "Parking";
    return "Apartment";
  }

  private extract(text: string, patterns: RegExp[]): string {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) return match[1].trim().replace(/\n.*/s, "").substring(0, 100);
    }
    return "";
  }

  private buildConfidence(
    property: PropertyData,
    buildings: BuildingData[],
    units: UnitData[],
    _text: string,
  ): FieldConfidenceMap {
    const propConf = (v: string | number) =>
      v && String(v).length > 0 ? "extracted" : "missing";

    return {
      property: {
        name: propConf(property.name) as FieldConfidence,
        number: propConf(property.number) as FieldConfidence,
        managementType: "extracted",
        propertyManager: propConf(property.propertyManager) as FieldConfidence,
        accountant: propConf(property.accountant) as FieldConfidence,
      },
      buildings: buildings.map((b) => ({
        name: propConf(b.name) as FieldConfidence,
        street: propConf(b.street) as FieldConfidence,
        houseNumber: propConf(b.houseNumber) as FieldConfidence,
        zipCode: propConf(b.zipCode) as FieldConfidence,
        city: propConf(b.city) as FieldConfidence,
        constructionYear: b.constructionYear > 0 ? "extracted" : ("missing" as FieldConfidence),
        floors: b.floors > 0 ? "extracted" : ("missing" as FieldConfidence),
      })),
      units: units.map((u) => ({
        number: propConf(u.number) as FieldConfidence,
        type: propConf(u.type) as FieldConfidence,
        floor: u.floor ? "extracted" : ("missing" as FieldConfidence),
        entrance: u.entrance ? "extracted" : ("missing" as FieldConfidence),
        sizeSqm: u.sizeSqm > 0 ? "extracted" : ("missing" as FieldConfidence),
        coOwnershipShare: propConf(u.coOwnershipShare) as FieldConfidence,
        constructionYear: u.constructionYear > 0 ? "extracted" : ("missing" as FieldConfidence),
        rooms: u.rooms !== null ? "extracted" : ("missing" as FieldConfidence),
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
