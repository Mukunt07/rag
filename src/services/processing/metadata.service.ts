import { ParsedDocument } from "./processing.types";

export class MetadataService {
  /**
   * Enriches the parsed document with additional metadata if missing,
   * such as reading time and language detection.
   */
  async extractMetadata(parsedDoc: ParsedDocument): Promise<ParsedDocument> {
    const text = parsedDoc.text;
    
    // Fallback counts if parser didn't provide them accurately
    const characterCount = text.length;
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    
    // Average reading speed is ~200-250 words per minute. We'll use 238 wpm.
    const readingTimeMinutes = Math.ceil(wordCount / 238);
    
    // Basic language detection (placeholder for a real lib like franc or cld)
    // For now, if it's mostly ascii, we assume English.
    const isMostlyAscii = /^[\x00-\x7F]*$/.test(text.substring(0, 1000));
    const language = parsedDoc.metadata.language !== "unknown" 
      ? parsedDoc.metadata.language 
      : (isMostlyAscii ? "en" : "unknown");

    parsedDoc.metadata = {
      ...parsedDoc.metadata,
      characterCount: parsedDoc.metadata.characterCount || characterCount,
      wordCount: parsedDoc.metadata.wordCount || wordCount,
      language,
      // Custom field we can append, although not in the original interface
      // readingTimeMinutes
    };
    
    // In a real implementation, you might save this to the DB here or just return it for the orchestrator
    
    return parsedDoc;
  }
}

export const metadataService = new MetadataService();
