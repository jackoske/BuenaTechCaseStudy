"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PropertiesService = class PropertiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async findOne(id) {
        const property = await this.prisma.property.findUnique({
            where: { id },
            include: {
                buildings: {
                    include: { units: true },
                },
            },
        });
        if (!property) {
            throw new common_1.NotFoundException(`Property #${id} not found`);
        }
        return property;
    }
    async create(dto) {
        const existing = await this.prisma.property.findUnique({
            where: { number: dto.number },
        });
        if (existing) {
            throw new common_1.ConflictException(`Property with number "${dto.number}" already exists`);
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
    async remove(id) {
        const property = await this.prisma.property.findUnique({ where: { id } });
        if (!property) {
            throw new common_1.NotFoundException(`Property #${id} not found`);
        }
        return this.prisma.property.delete({ where: { id } });
    }
};
exports.PropertiesService = PropertiesService;
exports.PropertiesService = PropertiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PropertiesService);
//# sourceMappingURL=properties.service.js.map