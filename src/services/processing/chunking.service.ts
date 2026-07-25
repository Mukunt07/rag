import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ParsedDocument } from "./processing.types";

export interface Chunk {
  content: string;
  metadata: {
    pageNumber?: number;
    chunkIndex: number;
  };
}

export class ChunkingService {
  /**
   * Splits a parsed document into smaller chunks for vector embedding.
   */
  async chunkDocument(
    parsedDoc: ParsedDocument, 
    chunkSize: number = 1000, 
    chunkOverlap: number = 200
  ): Promise<Chunk[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });

    const chunks: Chunk[] = [];
    let globalChunkIndex = 0;

    // If the document has pages, we can chunk per page to retain page metadata
    if (parsedDoc.pages && parsedDoc.pages.length > 0) {
      for (const page of parsedDoc.pages) {
        if (!page.text || page.text.trim().length === 0) continue;
        
        const splitTexts = await splitter.splitText(page.text);
        
        for (const text of splitTexts) {
          chunks.push({
            content: text,
            metadata: {
              pageNumber: page.pageNumber,
              chunkIndex: globalChunkIndex++,
            }
          });
        }
      }
    } else {
      // Fallback if no pages were parsed
      const splitTexts = await splitter.splitText(parsedDoc.text);
      for (const text of splitTexts) {
        chunks.push({
          content: text,
          metadata: {
            chunkIndex: globalChunkIndex++,
          }
        });
      }
    }

    return chunks;
  }
}

export const chunkingService = new ChunkingService();
