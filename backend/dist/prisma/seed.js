"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = __importDefault(require("pg"));
const pool = new pg_1.default.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    await prisma.unit.deleteMany();
    await prisma.building.deleteMany();
    await prisma.property.deleteMany();
    const parkview = await prisma.property.create({
        data: {
            name: "Parkview Residences Berlin",
            number: "10.557PRB",
            managementType: client_1.ManagementType.WEG,
            propertyManager: "ImmoGuard Berlin GmbH",
            accountant: "FinanzExpertise Müller & Co KG",
            buildings: {
                create: [
                    {
                        name: "Haus A - Parkside",
                        street: "Am Fiktivpark",
                        houseNumber: "12",
                        zipCode: "10557",
                        city: "Berlin",
                        constructionYear: 2023,
                        floors: 5,
                        units: {
                            create: [
                                { number: "01", type: client_1.UnitType.Apartment, floor: "EG", entrance: "A", sizeSqm: 95.0, coOwnershipShare: "110/1000", constructionYear: 2023, rooms: 3 },
                                { number: "02", type: client_1.UnitType.Apartment, floor: "EG", entrance: "A", sizeSqm: 92.5, coOwnershipShare: "108/1000", constructionYear: 2023, rooms: 3 },
                                { number: "03", type: client_1.UnitType.Apartment, floor: "1.OG", entrance: "A", sizeSqm: 105.0, coOwnershipShare: "120/1000", constructionYear: 2023, rooms: 4 },
                                { number: "04", type: client_1.UnitType.Apartment, floor: "2.OG", entrance: "A", sizeSqm: 78.0, coOwnershipShare: "90/1000", constructionYear: 2023, rooms: 2 },
                                { number: "05", type: client_1.UnitType.Apartment, floor: "4.OG", entrance: "A", sizeSqm: 145.0, coOwnershipShare: "160/1000", constructionYear: 2023, rooms: 4 },
                                { number: "14", type: client_1.UnitType.Garden, floor: "EG", entrance: "", sizeSqm: 40.0, coOwnershipShare: "5/1000", constructionYear: 2023, rooms: null },
                            ],
                        },
                    },
                    {
                        name: "Haus B - Cityside",
                        street: "Urbanstraße",
                        houseNumber: "88",
                        zipCode: "10557",
                        city: "Berlin",
                        constructionYear: 2023,
                        floors: 4,
                        units: {
                            create: [
                                { number: "06", type: client_1.UnitType.Office, floor: "EG", entrance: "B", sizeSqm: 110.0, coOwnershipShare: "125/1000", constructionYear: 2023, rooms: null },
                                { number: "07", type: client_1.UnitType.Apartment, floor: "1.OG", entrance: "B", sizeSqm: 65.0, coOwnershipShare: "75/1000", constructionYear: 2023, rooms: 2 },
                                { number: "08", type: client_1.UnitType.Apartment, floor: "2.OG", entrance: "B", sizeSqm: 88.0, coOwnershipShare: "102/1000", constructionYear: 2023, rooms: 3 },
                                { number: "09", type: client_1.UnitType.Parking, floor: "UG", entrance: "", sizeSqm: 12.5, coOwnershipShare: "1/1000", constructionYear: 2023, rooms: null },
                                { number: "10", type: client_1.UnitType.Parking, floor: "UG", entrance: "", sizeSqm: 12.5, coOwnershipShare: "1/1000", constructionYear: 2023, rooms: null },
                                { number: "11", type: client_1.UnitType.Parking, floor: "UG", entrance: "", sizeSqm: 12.5, coOwnershipShare: "1/1000", constructionYear: 2023, rooms: null },
                                { number: "12", type: client_1.UnitType.Parking, floor: "UG", entrance: "", sizeSqm: 12.5, coOwnershipShare: "1/1000", constructionYear: 2023, rooms: null },
                                { number: "13", type: client_1.UnitType.Parking, floor: "UG", entrance: "", sizeSqm: 12.5, coOwnershipShare: "1/1000", constructionYear: 2023, rooms: null },
                            ],
                        },
                    },
                ],
            },
        },
    });
    const stadtgarten = await prisma.property.create({
        data: {
            name: "Stadtgarten Komplex",
            number: "20.881SGK",
            managementType: client_1.ManagementType.MV,
            propertyManager: "Berliner Hausverwaltung GmbH",
            accountant: "Steuerberatung Koch & Partner",
            buildings: {
                create: [
                    {
                        name: "Hauptgebäude",
                        street: "Gartenstraße",
                        houseNumber: "42",
                        zipCode: "10115",
                        city: "Berlin",
                        constructionYear: 2018,
                        floors: 6,
                        units: {
                            create: Array.from({ length: 24 }, (_, i) => ({
                                number: String(i + 1).padStart(2, "0"),
                                type: client_1.UnitType.Apartment,
                                floor: `${Math.floor(i / 4)}.OG`,
                                entrance: i % 2 === 0 ? "A" : "B",
                                sizeSqm: 65 + (i % 5) * 10,
                                coOwnershipShare: `${60 + i * 2}/1000`,
                                constructionYear: 2018,
                                rooms: 2 + (i % 3),
                            })),
                        },
                    },
                    {
                        name: "Nebengebäude",
                        street: "Gartenstraße",
                        houseNumber: "44",
                        zipCode: "10115",
                        city: "Berlin",
                        constructionYear: 2019,
                        floors: 4,
                        units: {
                            create: [
                                ...Array.from({ length: 16 }, (_, i) => ({
                                    number: String(i + 25).padStart(2, "0"),
                                    type: client_1.UnitType.Apartment,
                                    floor: `${Math.floor(i / 4)}.OG`,
                                    entrance: "C",
                                    sizeSqm: 55 + (i % 4) * 8,
                                    coOwnershipShare: `${40 + i}/1000`,
                                    constructionYear: 2019,
                                    rooms: 2 + (i % 2),
                                })),
                                ...Array.from({ length: 2 }, (_, i) => ({
                                    number: String(i + 41).padStart(2, "0"),
                                    type: client_1.UnitType.Parking,
                                    floor: "UG",
                                    entrance: "",
                                    sizeSqm: 14.0,
                                    coOwnershipShare: "2/1000",
                                    constructionYear: 2019,
                                    rooms: null,
                                })),
                            ],
                        },
                    },
                ],
            },
        },
    });
    const riverside = await prisma.property.create({
        data: {
            name: "Riverside Apartments",
            number: "30.223RSA",
            managementType: client_1.ManagementType.WEG,
            propertyManager: "Spree Immobilien GmbH",
            accountant: "Wirtschaftsprüfer Schmidt & Co",
            buildings: {
                create: [
                    {
                        name: "Riverside Tower",
                        street: "Spreeufer",
                        houseNumber: "7",
                        zipCode: "10178",
                        city: "Berlin",
                        constructionYear: 2021,
                        floors: 4,
                        units: {
                            create: [
                                { number: "01", type: client_1.UnitType.Apartment, floor: "EG", entrance: "A", sizeSqm: 72.0, coOwnershipShare: "125/1000", constructionYear: 2021, rooms: 2 },
                                { number: "02", type: client_1.UnitType.Apartment, floor: "1.OG", entrance: "A", sizeSqm: 85.0, coOwnershipShare: "148/1000", constructionYear: 2021, rooms: 3 },
                                { number: "03", type: client_1.UnitType.Apartment, floor: "1.OG", entrance: "A", sizeSqm: 91.0, coOwnershipShare: "158/1000", constructionYear: 2021, rooms: 3 },
                                { number: "04", type: client_1.UnitType.Apartment, floor: "2.OG", entrance: "A", sizeSqm: 110.0, coOwnershipShare: "191/1000", constructionYear: 2021, rooms: 4 },
                                { number: "05", type: client_1.UnitType.Apartment, floor: "3.OG", entrance: "A", sizeSqm: 135.0, coOwnershipShare: "234/1000", constructionYear: 2021, rooms: 4 },
                                { number: "06", type: client_1.UnitType.Office, floor: "EG", entrance: "B", sizeSqm: 62.0, coOwnershipShare: "107/1000", constructionYear: 2021, rooms: null },
                                { number: "07", type: client_1.UnitType.Parking, floor: "UG", entrance: "", sizeSqm: 15.0, coOwnershipShare: "18/1000", constructionYear: 2021, rooms: null },
                                { number: "08", type: client_1.UnitType.Parking, floor: "UG", entrance: "", sizeSqm: 15.0, coOwnershipShare: "19/1000", constructionYear: 2021, rooms: null },
                            ],
                        },
                    },
                ],
            },
        },
    });
    console.log(`Seeded:`);
    console.log(`  Property 1: ${parkview.name} (${parkview.number})`);
    console.log(`  Property 2: ${stadtgarten.name} (${stadtgarten.number})`);
    console.log(`  Property 3: ${riverside.name} (${riverside.number})`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map