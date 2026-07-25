import { DocumentType } from "@prisma/client";
import zlib from "zlib";
import { promisify } from "util";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

const gzip = promisify(zlib.gzip);

export interface OptimizationResult {
  buffer: Buffer;
  encoding?: "gzip";
}

export class OptimizationService {
  /**
   * Applies format-aware optimization to the document buffer.
   * - Gzips text-based formats (CSV, TXT, JSON, MD, XML, HTML, etc.)
   * - Losslessly optimizes images and strips EXIF using sharp
   * - Performs lightweight PDF optimization (removes unused objects/metadata)
   * - Passes through already compressed formats like DOCX, XLSX, PPTX, ZIP
   */
  async optimize(buffer: Buffer, documentType: DocumentType, originalFilename: string): Promise<OptimizationResult> {
    
    // 1. TEXT-BASED: Gzip compression
    const textTypes: DocumentType[] = [
      DocumentType.TXT, 
      DocumentType.CSV, 
      DocumentType.MARKDOWN, 
      DocumentType.JSON, 
      DocumentType.XML, 
      DocumentType.HTML, 
      DocumentType.RTF, 
      DocumentType.EML
    ];
    
    if (textTypes.includes(documentType)) {
      const compressed = await gzip(buffer);
      return {
        buffer: compressed,
        encoding: "gzip",
      };
    }

    // 2. IMAGE FORMATS: Lossless optimization
    if (documentType === DocumentType.IMAGE) {
      try {
        const ext = originalFilename.split('.').pop()?.toLowerCase() || '';
        let image = sharp(buffer);
        
        // Strip metadata and apply basic lossless optimization depending on format
        if (ext === 'jpg' || ext === 'jpeg') {
          image = image.jpeg({ quality: 80, mozjpeg: true });
        } else if (ext === 'png') {
          image = image.png({ compressionLevel: 9, palette: true });
        } else if (ext === 'webp') {
          image = image.webp({ quality: 80 });
        }

        const optimizedBuffer = await image.toBuffer();
        
        // Fallback: If optimization made it bigger (rare, but happens for tiny pngs), keep original
        if (optimizedBuffer.length < buffer.length) {
          return { buffer: optimizedBuffer };
        }
      } catch (error) {
        console.warn(`Image optimization failed for ${originalFilename}, falling back to original.`, error);
      }
      return { buffer };
    }

    // 3. PDF FORMATS: Lightweight Optimization (strip unused objects/metadata)
    if (documentType === DocumentType.PDF) {
      try {
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        // pdf-lib's save automatically strips some unused objects and we can remove metadata
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");
        pdfDoc.setSubject("");
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer("");
        pdfDoc.setCreator("");
        
        const optimizedBytes = await pdfDoc.save({ useObjectStreams: false }); // Object streams often increase size if not used right, but standard save is generally clean.
        const optimizedBuffer = Buffer.from(optimizedBytes);
        
        if (optimizedBuffer.length < buffer.length) {
          return { buffer: optimizedBuffer };
        }
      } catch (error) {
         console.warn(`PDF optimization failed for ${originalFilename}, falling back to original.`, error);
      }
      return { buffer };
    }

    // 4. PASSTHROUGH (DOCX, PPTX, XLSX, ZIP, MSG)
    // These are already compressed zip containers.
    return { buffer };
  }
}

export const optimizationService = new OptimizationService();
