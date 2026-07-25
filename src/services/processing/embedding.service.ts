import { EmbeddingProvider } from "../providers/embedding/embedding.provider";
import { geminiEmbeddingProvider } from "../providers/embedding/gemini-embedding.provider";
import { Chunk } from "./chunking.service";

export interface EmbeddedChunk extends Chunk {
  vector: number[];
}

export class EmbeddingService {
  private provider: EmbeddingProvider;

  constructor(provider?: EmbeddingProvider) {
    // Default to Gemini, but could be injected based on workspace settings
    this.provider = provider || geminiEmbeddingProvider;
  }

  /**
   * Generates vector embeddings for a list of chunks.
   */
  async embedChunks(chunks: Chunk[]): Promise<EmbeddedChunk[]> {
    const texts = chunks.map(c => c.content);
    
    // Batch process in chunks of 100 to avoid API rate limits
    const batchSize = 100;
    const embeddedChunks: EmbeddedChunk[] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batchTexts = texts.slice(i, i + batchSize);
      const batchChunks = chunks.slice(i, i + batchSize);
      
      const vectors = await this.provider.generateEmbeddings(batchTexts);
      
      for (let j = 0; j < batchChunks.length; j++) {
        embeddedChunks.push({
          ...batchChunks[j],
          vector: vectors[j]
        });
      }
    }
    
    return embeddedChunks;
  }
}

export const embeddingService = new EmbeddingService();
