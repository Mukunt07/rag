import { DocumentType } from "@prisma/client";
import { DocumentParser } from "./parsers/parser.interface";
import { PdfParser } from "./parsers/pdf-parser";
import { DocxParser } from "./parsers/docx-parser";
import { ExcelParser } from "./parsers/excel-parser";
import { ImageParser } from "./parsers/image-parser";

export class ParserFactoryService {
  private pdfParser = new PdfParser();
  private docxParser = new DocxParser();
  private excelParser = new ExcelParser();
  private imageParser = new ImageParser();

  getParser(documentType: DocumentType): DocumentParser {
    switch (documentType) {
      case DocumentType.PDF:
        return this.pdfParser;
      case DocumentType.DOC:
      case DocumentType.DOCX:
        return this.docxParser;
      case DocumentType.XLS:
      case DocumentType.XLSX:
      case DocumentType.CSV: // We can handle CSV with xlsx or string split. xlsx library supports CSV
        return this.excelParser;
      case DocumentType.IMAGE:
        return this.imageParser;
      // For plain text formats, we can just create a quick inline parser
      case DocumentType.TXT:
      case DocumentType.MARKDOWN:
      case DocumentType.JSON:
      case DocumentType.XML:
      case DocumentType.HTML:
        return {
          parse: async (buffer: Buffer, filename: string) => {
            const text = buffer.toString('utf-8');
            return {
              text,
              pages: [{ pageNumber: 1, text }],
              metadata: {
                pageCount: 1,
                wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
                characterCount: text.length,
                hasTables: false,
                hasImages: false,
                parserUsed: "utf8-buffer",
                extractionTimeMs: 0,
                ocrUsed: false,
              },
              tables: [],
              images: []
            };
          }
        };
      default:
        throw new Error(`No parser available for document type: ${documentType}`);
    }
  }
}

export const parserFactory = new ParserFactoryService();
