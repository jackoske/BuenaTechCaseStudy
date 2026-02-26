import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateBuildingDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() street?: string;
  @IsOptional() @IsString() houseNumber?: string;
  @IsOptional() @IsString() zipCode?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsInt() constructionYear?: number;
  @IsOptional() @IsInt() floors?: number;
}
