import { Body, Controller, Param, ParseIntPipe, Patch } from "@nestjs/common";
import { PropertiesService } from "./properties.service";
import { UpdateBuildingDto } from "./dto/update-building.dto";

@Controller("buildings")
export class BuildingsController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateBuildingDto) {
    return this.propertiesService.updateBuilding(id, dto);
  }
}
