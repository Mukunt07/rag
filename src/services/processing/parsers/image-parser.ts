import Tesseract from "tesseract.js";
import { DocumentParser } from "./parser.interface";
import { ParsedDocument } from "../processing.types";

export class ImageParser implements DocumentParser {
  async parse(buffer: Buffer, filename: string): Promise<ParsedDocument> {
    const startTime = Date.now();
    
    // Tesseract.js recognizes buffers directly in Node
    const result = await Tesseract.recognize(buffer, 'eng', {
      logger: m => console.log(`[Tesseract] ${filename}: ${m.status} - ${m.progress}`)
    });
    
    const text = result.data.text;
    const extractionTimeMs = Date.now() - startTime;
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    
    // Also extract confidence
    const confidence = result.data.confidence;

    return {
      text,
      pages: [{ pageNumber: 1, text }],
      metadata: {
        pageCount: 1,
        wordCount,
        characterCount: text.length,
        language: "en", // Assuming English for now based on 'eng' passed to recognize
        hasTables: false,
        hasImages: true, // It is an image itself
        parserUsed: "tesseract.js",
        extractionTimeMs,
        ocrUsed: true,
        extractionConfidence: confidence,
      },
      tables: [],
      images: [{ pageNumber: 1, buffer }] // Store the original image if needed
    };
  }
}
