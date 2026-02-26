import { ManagementType, UnitType } from "@prisma/client";
export declare class CreateUnitDto {
    number: string;
    type: UnitType;
    floor: string;
    entrance: string;
    sizeSqm: number;
    coOwnershipShare: string;
    constructionYear: number;
    rooms?: number | null;
}
export declare class CreateBuildingDto {
    name: string;
    street: string;
    houseNumber: string;
    zipCode: string;
    city: string;
    constructionYear: number;
    floors: number;
    units: CreateUnitDto[];
}
export declare class CreatePropertyDto {
    name: string;
    number: string;
    managementType: ManagementType;
    propertyManager: string;
    accountant: string;
    buildings: CreateBuildingDto[];
}
