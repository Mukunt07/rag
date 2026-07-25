import * as mammoth from "mammoth";
import { DocumentParser } from "./parser.interface";
import { ParsedDocument } from "../processing.types";

export class DocxParser implements DocumentParser {
  async parse(buffer: Buffer, filename: string): Promise<ParsedDocument> {
    const startTime = Date.now();
    
    // mammoth doesn't easily support page numbers since docx is reflowable.
    // We will extract text and treat it as a single page for chunking purposes.
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    const extractionTimeMs = Date.now() - startTime;
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    return {
      text,
      pages: [{ pageNumber: 1, text }], // DOCX treated as 1 page
      metadata: {
        pageCount: 1,
        wordCount,
        characterCount: text.length,
        language: "unknown", 
        hasTables: false, // Could be enhanced using mammoth HTML extraction
        hasImages: false,
        parserUsed: "mammoth",
        extractionTimeMs,
        ocrUsed: false,
      },
      tables: [],
      images: []
    };
  }
}
