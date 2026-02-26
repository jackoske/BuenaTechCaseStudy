import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { UpdateBuildingDto } from "./dto/update-building.dto";
import { UpdateUnitDto } from "./dto/update-unit.dto";

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const properties = await this.prisma.property.findMany({
      include: {
        buildings: {
          include: { units: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return properties.map((p) => ({
      id: p.id,
      name: p.name,
      number: p.number,
      managementType: p.managementType,
      propertyManager: p.propertyManager,
      accountant: p.accountant,
      createdAt: p.createdAt,
      buildingCount: p.buildings.length,
      unitCount: p.buildings.reduce((sum, b) => sum + b.units.length, 0),
    }));
  }

  async findOne(id: number) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        buildings: {
          include: { units: true },
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property #${id} not found`);
    }

    return property;
  }

  async create(dto: CreatePropertyDto) {
    const existing = await this.prisma.property.findUnique({
      where: { number: dto.number },
    });

    if (existing) {
      throw new ConflictException(
        `Property with number "${dto.number}" already exists`,
      );
    }

    return this.prisma.property.create({
      data: {
        name: dto.name,
        number: dto.number,
        managementType: dto.managementType,
        propertyManager: dto.propertyManager,
        accountant: dto.accountant,
        buildings: {
          create: dto.buildings.map((b) => ({
            name: b.name,
            street: b.street,
            houseNumber: b.houseNumber,
            zipCode: b.zipCode,
            city: b.city,
            constructionYear: b.constructionYear,
            floors: b.floors,
            units: {
              create: b.units.map((u) => ({
                number: u.number,
                type: u.type,
                floor: u.floor,
                entrance: u.entrance,
                sizeSqm: u.sizeSqm,
                coOwnershipShare: u.coOwnershipShare,
                constructionYear: u.constructionYear,
                rooms: u.rooms ?? null,
              })),
            },
          })),
        },
      },
      include: {
        buildings: {
          include: { units: true },
        },
      },
    });
  }

  async updateProperty(id: number, dto: UpdatePropertyDto) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException(`Property #${id} not found`);
    return this.prisma.property.update({ where: { id }, data: dto });
  }

  async updateBuilding(id: number, dto: UpdateBuildingDto) {
    const building = await this.prisma.building.findUnique({ where: { id } });
    if (!building) throw new NotFoundException(`Building #${id} not found`);
    return this.prisma.building.update({ where: { id }, data: dto });
  }

  async updateUnit(id: number, dto: UpdateUnitDto) {
    const unit = await this.prisma.unit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException(`Unit #${id} not found`);
    return this.prisma.unit.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) {
      throw new NotFoundException(`Property #${id} not found`);
    }
    return this.prisma.property.delete({ where: { id } });
  }
}
