import { PropertiesService } from "./properties.service";
import { CreatePropertyDto } from "./dto/create-property.dto";
export declare class PropertiesController {
    private readonly propertiesService;
    constructor(propertiesService: PropertiesService);
    findAll(): Promise<{
        id: number;
        name: string;
        number: string;
        managementType: import("@prisma/client").$Enums.ManagementType;
        propertyManager: string;
        accountant: string;
        createdAt: Date;
        buildingCount: number;
        unitCount: number;
    }[]>;
    findOne(id: number): Promise<{
        buildings: ({
            units: {
                number: string;
                id: number;
                constructionYear: number;
                type: import("@prisma/client").$Enums.UnitType;
                floor: string;
                entrance: string;
                sizeSqm: number;
                coOwnershipShare: string;
                rooms: number | null;
                buildingId: number;
            }[];
        } & {
            name: string;
            id: number;
            street: string;
            houseNumber: string;
            zipCode: string;
            city: string;
            constructionYear: number;
            floors: number;
            propertyId: number;
        })[];
    } & {
        number: string;
        name: string;
        managementType: import("@prisma/client").$Enums.ManagementType;
        propertyManager: string;
        accountant: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
    create(dto: CreatePropertyDto): Promise<{
        buildings: ({
            units: {
                number: string;
                id: number;
                constructionYear: number;
                type: import("@prisma/client").$Enums.UnitType;
                floor: string;
                entrance: string;
                sizeSqm: number;
                coOwnershipShare: string;
                rooms: number | null;
                buildingId: number;
            }[];
        } & {
            name: string;
            id: number;
            street: string;
            houseNumber: string;
            zipCode: string;
            city: string;
            constructionYear: number;
            floors: number;
            propertyId: number;
        })[];
    } & {
        number: string;
        name: string;
        managementType: import("@prisma/client").$Enums.ManagementType;
        propertyManager: string;
        accountant: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
    remove(id: number): Promise<{
        number: string;
        name: string;
        managementType: import("@prisma/client").$Enums.ManagementType;
        propertyManager: string;
        accountant: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
}
