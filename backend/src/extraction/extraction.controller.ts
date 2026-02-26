import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ExtractionService } from "./extraction.service";

@Controller("extraction")
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

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
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file uploaded. Please upload a PDF.");
    }
    return this.extractionService.extractFromPdf(file.buffer);
  }
}
