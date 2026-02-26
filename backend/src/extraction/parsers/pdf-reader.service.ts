import { Injectable, Logger } from "@nestjs/common";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require("pdf-parse");

@Injectable()
export class PdfReaderService {
  private readonly logger = new Logger(PdfReaderService.name);

  async extractText(buffer: Buffer): Promise<string> {
    try {
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      await parser.destroy();
      const text = data.text?.trim() || "";

      if (text.length < 50) {
        this.logger.warn("PDF text too short, may be scanned. OCR not implemented.");
        return text;
      }

      this.logger.log(`Extracted ${text.length} chars from PDF`);
      return text;
    } catch (error) {
      this.logger.error("Failed to parse PDF", error);
      return "";
    }
  }
}
