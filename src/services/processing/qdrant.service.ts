import { QdrantClient } from "@qdrant/js-client-rest";
import { EmbeddedChunk } from "./embedding.service";
import { v4 as uuidv4 } from "uuid";

export class QdrantService {
  private client: QdrantClient;
  private collectionName = "documents";

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || "http://localhost:6333",
      apiKey: process.env.QDRANT_API_KEY,
    });
  }

  async ensureCollectionExists(vectorSize: number = 768) { // 768 is typical for Gemini
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(c => c.name === this.collectionName);
      
      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: vectorSize,
            distance: "Cosine",
          },
        });
      }
    } catch (error) {
      console.error("Error ensuring Qdrant collection exists:", error);
      throw error;
    }
  }

  async indexChunks(document: any, chunks: EmbeddedChunk[]) {
    if (chunks.length === 0) return;
    
    // Assuming vector size from the first chunk
    await this.ensureCollectionExists(chunks[0].vector.length);

    const points = chunks.map(chunk => ({
      id: uuidv4(),
      vector: chunk.vector,
      payload: {
        workspaceId: document.workspaceId,
        documentId: document.id,
        documentName: document.title,
        source: document.originalFilename,
        pageNumber: chunk.metadata.pageNumber,
        chunkIndex: chunk.metadata.chunkIndex,
        language: document.language || "en",
        section: "", // Reserved for future section detection
        text: chunk.content,
        wordCount: chunk.content.split(/\s+/).filter(w => w.length > 0).length,
      }
    }));

    // Batch upsert in sizes of 100
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: batch,
      });
    }
    
    return points.map(p => p.id);
  }
}

export const qdrantService = new QdrantService();
