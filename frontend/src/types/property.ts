export type ManagementType = "WEG" | "MV";
export type UnitType = "Apartment" | "Office" | "Garden" | "Parking";
export type FieldConfidence = "extracted" | "inferred" | "missing";

export interface Unit {
  id: number;
  buildingId: number;
  number: string;
  type: UnitType;
  floor: string;
  entrance: string;
  sizeSqm: number;
  coOwnershipShare: string;
  constructionYear: number;
  rooms: number | null;
}

export interface Building {
  id: number;
  propertyId: number;
  name: string;
  street: string;
  houseNumber: string;
  zipCode: string;
  city: string;
  constructionYear: number;
  floors: number;
  units: Unit[];
}

export interface Property {
  id: number;
  name: string;
  number: string;
  managementType: ManagementType;
  propertyManager: string;
  accountant: string;
  createdAt: string;
  buildings: Building[];
}

export interface PropertySummary {
  id: number;
  name: string;
  number: string;
  managementType: ManagementType;
  propertyManager: string;
  accountant: string;
  createdAt: string;
  buildingCount: number;
  unitCount: number;
}

// Wizard state types
export interface UnitFormData {
  number: string;
  type: UnitType;
  floor: string;
  entrance: string;
  sizeSqm: number | "";
  coOwnershipShare: string;
  constructionYear: number | "";
  rooms: number | null | "";
}

export interface BuildingFormData {
  name: string;
  street: string;
  houseNumber: string;
  zipCode: string;
  city: string;
  constructionYear: number | "";
  floors: number | "";
  units: UnitFormData[];
}

export interface PropertyFormData {
  name: string;
  number: string;
  managementType: ManagementType;
  propertyManager: string;
  accountant: string;
  buildings: BuildingFormData[];
}

// Extraction types
export interface FieldConfidenceMap {
  property: Record<keyof Omit<PropertyFormData, "buildings">, FieldConfidence>;
  buildings: Record<keyof Omit<BuildingFormData, "units">, FieldConfidence>[];
  units: Record<keyof UnitFormData, FieldConfidence>[];
}

export interface ExtractionData {
  property: Omit<PropertyFormData, "buildings">;
  buildings: Array<Omit<BuildingFormData, "units">>;
  units: UnitFormData[];
  fieldConfidence: FieldConfidenceMap;
}

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
  extraction: ExtractionData | null;
  extractionMethod: string | null;
  overallConfidence: number;
  duplicates: DuplicateMatch[];
  error?: string;
}
