import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreateBuildingDto {
  @IsInt() @IsNotEmpty() propertyId: number;
  @IsString() @IsNotEmpty() name: string;
  @IsString() street: string;
  @IsString() houseNumber: string;
  @IsString() zipCode: string;
  @IsString() city: string;
  @IsInt() constructionYear: number;
  @IsInt() floors: number;
}
