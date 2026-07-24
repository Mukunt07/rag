import { DocumentType } from "@prisma/client";
import path from "path";

// Mapping extensions to DocumentTypes
const EXTENSION_MAP: Record<string, DocumentType> = {
  ".pdf": DocumentType.PDF,
  ".doc": DocumentType.DOC,
  ".docx": DocumentType.DOCX,
  ".txt": DocumentType.TXT,
  ".md": DocumentType.MARKDOWN,
  ".rtf": DocumentType.RTF,
  ".ppt": DocumentType.PPT,
  ".pptx": DocumentType.PPTX,
  ".xls": DocumentType.XLS,
  ".xlsx": DocumentType.XLSX,
  ".csv": DocumentType.CSV,
  ".png": DocumentType.IMAGE,
  ".jpg": DocumentType.IMAGE,
  ".jpeg": DocumentType.IMAGE,
  ".webp": DocumentType.IMAGE,
  ".tiff": DocumentType.IMAGE,
  ".bmp": DocumentType.IMAGE,
  ".json": DocumentType.JSON,
  ".xml": DocumentType.XML,
  ".html": DocumentType.HTML,
  ".zip": DocumentType.ZIP,
  ".eml": DocumentType.EML,
  ".msg": DocumentType.MSG,
};

// Some text-based files cannot be robustly identified by magic bytes alone using file-type
const TEXT_BASED_EXTENSIONS = [".txt", ".md", ".csv", ".json", ".xml", ".html", ".rtf", ".eml"];

export class ValidationService {
  /**
   * Validates the file buffer and determines the final DocumentType and correct MIME type.
   * Uses magic bytes to prevent file spoofing.
   */
  async validateFile(buffer: Buffer, originalFilename: string, providedMimeType: string) {
    const ext = path.extname(originalFilename).toLowerCase();
    const mappedType = EXTENSION_MAP[ext];

    if (!mappedType) {
      throw new Error(`Unsupported file extension: ${ext}`);
    }

    // Use dynamic import for ESM-only file-type
    const { fileTypeFromBuffer } = await import("file-type");
    const detectedType = await fileTypeFromBuffer(buffer);

    let finalMimeType = providedMimeType;

    // Magic byte logic
    if (detectedType) {
      finalMimeType = detectedType.mime;

      // Ensure the detected type logically matches the extension provided to prevent spoofing
      if (mappedType === DocumentType.PDF && detectedType.ext !== "pdf") {
        throw new Error("File spoofing detected: Extension is .pdf but file is not a PDF.");
      }
      
      if (mappedType === DocumentType.IMAGE && !detectedType.mime.startsWith("image/")) {
        throw new Error("File spoofing detected: Extension indicates an image but file is not.");
      }
      
      if (mappedType === DocumentType.ZIP && detectedType.ext !== "zip") {
        // DOCX, PPTX, XLSX are essentially ZIP files under the hood, so file-type might return zip/docx
        const validZipLike = ["zip", "docx", "pptx", "xlsx"];
        if (!validZipLike.includes(detectedType.ext)) {
           throw new Error("File spoofing detected: Invalid archive format.");
        }
      }
    } else {
      // file-type could not detect magic bytes (common for plain text files like TXT, CSV, MD)
      if (!TEXT_BASED_EXTENSIONS.includes(ext)) {
         // If it's a binary format like PDF or JPG, file-type SHOULD have detected it.
         throw new Error("Invalid file: Could not detect valid file signature for binary file.");
      }
    }

    return {
      documentType: mappedType,
      mimeType: finalMimeType,
    };
  }
}

export const validationService = new ValidationService();
