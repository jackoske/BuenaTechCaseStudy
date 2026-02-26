import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from "class-validator";
import { UnitType } from "@prisma/client";

export class UpdateUnitDto {
  @IsOptional() @IsString() number?: string;
  @IsOptional() @IsEnum(UnitType) type?: UnitType;
  @IsOptional() @IsString() floor?: string;
  @IsOptional() @IsString() entrance?: string;
  @IsOptional() @IsNumber() sizeSqm?: number;
  @IsOptional() @IsString() coOwnershipShare?: string;
  @IsOptional() @IsInt() constructionYear?: number;
  @IsOptional() @IsInt() rooms?: number | null;
}
