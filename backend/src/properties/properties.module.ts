import { Module } from "@nestjs/common";
import { PropertiesController } from "./properties.controller";
import { BuildingsController } from "./buildings.controller";
import { UnitsController } from "./units.controller";
import { PropertiesService } from "./properties.service";

@Module({
  controllers: [PropertiesController, BuildingsController, UnitsController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
