export type FieldConfidence = "extracted" | "inferred" | "missing";

export interface PropertyData {
  name: string;
  number: string;
  managementType: "WEG" | "MV";
  propertyManager: string;
  accountant: string;
}

export interface BuildingData {
  name: string;
  street: string;
  houseNumber: string;
  zipCode: string;
  city: string;
  constructionYear: number;
  floors: number;
}

export interface UnitData {
  number: string;
  type: "Apartment" | "Office" | "Garden" | "Parking";
  floor: string;
  entrance: string;
  sizeSqm: number;
  coOwnershipShare: string;
  constructionYear: number;
  rooms: number | null;
}

export interface FieldConfidenceMap {
  property: Record<keyof PropertyData, FieldConfidence>;
  buildings: Record<keyof BuildingData, FieldConfidence>[];
  units: Record<keyof UnitData, FieldConfidence>[];
}

export interface ExtractionResult {
  property: PropertyData;
  buildings: BuildingData[];
  units: UnitData[];
  fieldConfidence: FieldConfidenceMap;
}

export interface ParseResult {
  data: ExtractionResult;
  confidence: number;
  method: string;
}
