import { ProviderResolver } from "@/services/ai/provider.resolver";
import { AIProviderId } from "@/services/ai/models.registry";
import { Chunk } from "./chunking.service";
import { prisma } from "@/lib/prisma";

export interface EmbeddedChunk extends Chunk {
  vector: number[];
}

export class EmbeddingService {
  /**
   * Generates vector embeddings for a list of chunks using the user's active AI provider.
   */
  async embedChunks(userId: string, chunks: Chunk[]): Promise<EmbeddedChunk[]> {
    const texts = chunks.map(c => c.content);
    
    // Find the user's default provider, or fallback to any configured provider
    let apiKeyRecord = await (prisma as any).userApiKey.findFirst({
      where: { userId, isDefault: true }
    });
    
    if (!apiKeyRecord) {
      apiKeyRecord = await (prisma as any).userApiKey.findFirst({
        where: { userId }
      });
    }

    if (!apiKeyRecord) {
      throw new Error("No API key configured for generating embeddings. Please set up a provider in Settings.");
    }

    const providerId = apiKeyRecord.provider as AIProviderId;
    // Use the standard embedding model for the given provider
    const modelId = providerId === "openai" ? "text-embedding-3-small" : "text-embedding-004";

    const { provider, config } = await ProviderResolver.resolve(userId, providerId, modelId);
    
    // Batch process in chunks of 100 to avoid API rate limits
    const batchSize = 100;
    const embeddedChunks: EmbeddedChunk[] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batchTexts = texts.slice(i, i + batchSize);
      const batchChunks = chunks.slice(i, i + batchSize);
      
      const vectors = await provider.generateEmbeddings(batchTexts, config);
      
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
