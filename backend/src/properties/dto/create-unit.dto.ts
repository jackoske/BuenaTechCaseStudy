import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { UnitType } from "@prisma/client";

export class CreateUnitDto {
  @IsInt() @IsNotEmpty() buildingId: number;
  @IsString() @IsNotEmpty() number: string;
  @IsEnum(UnitType) type: UnitType;
  @IsString() floor: string;
  @IsString() entrance: string;
  @IsNumber() sizeSqm: number;
  @IsString() coOwnershipShare: string;
  @IsInt() constructionYear: number;
  @IsOptional() @IsInt() rooms?: number | null;
}
