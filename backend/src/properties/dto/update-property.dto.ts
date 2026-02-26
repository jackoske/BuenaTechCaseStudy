import { IsEnum, IsOptional, IsString } from "class-validator";
import { ManagementType } from "@prisma/client";

export class UpdatePropertyDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() number?: string;
  @IsOptional() @IsEnum(ManagementType) managementType?: ManagementType;
  @IsOptional() @IsString() propertyManager?: string;
  @IsOptional() @IsString() accountant?: string;
}
