import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { PropertiesModule } from "./properties/properties.module";
import { ExtractionModule } from "./extraction/extraction.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PropertiesModule,
    ExtractionModule,
  ],
})
export class AppModule {}
