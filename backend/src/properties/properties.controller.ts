import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { PropertiesService } from "./properties.service";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";

@Controller("properties")
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.propertiesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(dto);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.updateProperty(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.propertiesService.remove(id);
  }
}
