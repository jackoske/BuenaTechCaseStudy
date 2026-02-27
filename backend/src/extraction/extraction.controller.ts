import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { memoryStorage } from "multer";
import { ExtractionService, ExtractionMethod } from "./extraction.service";

const VALID_METHODS: ExtractionMethod[] = ["auto", "regex", "openai", "gemini", "ollama"];

@Controller("extraction")
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Throttle({ default: { ttl: 60_000, limit: 10 } }) // 10 PDF uploads/min
  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== "application/pdf") {
          return cb(new BadRequestException("Only PDF files are accepted"), false);
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body("method") method?: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded. Please upload a PDF.");
    }

    const resolvedMethod: ExtractionMethod =
      method && VALID_METHODS.includes(method as ExtractionMethod)
        ? (method as ExtractionMethod)
        : "auto";

    return this.extractionService.extractFromPdf(file.buffer, resolvedMethod);
  }
}
