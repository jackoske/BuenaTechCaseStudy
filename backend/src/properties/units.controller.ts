import { Body, Controller, Param, ParseIntPipe, Patch } from "@nestjs/common";
import { PropertiesService } from "./properties.service";
import { UpdateUnitDto } from "./dto/update-unit.dto";

@Controller("units")
export class UnitsController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateUnitDto) {
    return this.propertiesService.updateUnit(id, dto);
  }
}
