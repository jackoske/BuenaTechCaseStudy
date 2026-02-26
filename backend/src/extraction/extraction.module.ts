import { Module } from "@nestjs/common";
import { ExtractionController } from "./extraction.controller";
import { ExtractionService } from "./extraction.service";
import { PdfReaderService } from "./parsers/pdf-reader.service";
import { RegexParserService } from "./parsers/regex-parser.service";
import { OpenAiParserService } from "./parsers/openai-parser.service";
import { GeminiParserService } from "./parsers/gemini-parser.service";
import { OllamaParserService } from "./parsers/ollama-parser.service";

@Module({
  controllers: [ExtractionController],
  providers: [
    ExtractionService,
    PdfReaderService,
    RegexParserService,
    OpenAiParserService,
    GeminiParserService,
    OllamaParserService,
  ],
})
export class ExtractionModule {}
