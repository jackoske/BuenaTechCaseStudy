import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ManagementType, UnitType } from "@prisma/client";

export class CreateUnitDto {
  @IsString() @IsNotEmpty() number: string;
  @IsEnum(UnitType) type: UnitType;
  @IsString() @IsNotEmpty() floor: string;
  @IsString() entrance: string;
  @IsNumber() sizeSqm: number;
  @IsString() @IsNotEmpty() coOwnershipShare: string;
  @IsInt() constructionYear: number;
  @IsOptional() @IsInt() rooms?: number | null;
}

export class CreateBuildingDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() street: string;
  @IsString() @IsNotEmpty() houseNumber: string;
  @IsString() @IsNotEmpty() zipCode: string;
  @IsString() @IsNotEmpty() city: string;
  @IsInt() constructionYear: number;
  @IsInt() floors: number;

  @ValidateNested({ each: true })
  @Type(() => CreateUnitDto)
  units: CreateUnitDto[];
}

export class CreatePropertyDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() number: string;
  @IsEnum(ManagementType) managementType: ManagementType;
  @IsString() @IsNotEmpty() propertyManager: string;
  @IsString() @IsNotEmpty() accountant: string;

  @ValidateNested({ each: true })
  @Type(() => CreateBuildingDto)
  buildings: CreateBuildingDto[];
}
