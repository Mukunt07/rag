import { QdrantClient } from "@qdrant/js-client-rest";
import { embeddingService } from "../processing/embedding.service";
import { geminiEmbeddingProvider } from "../providers/embedding/gemini-embedding.provider";
import { SearchOptions, RetrievedChunk, RetrievalResponse, RetrievalMetrics } from "./retrieval.types";

export class RetrievalService {
  private client: QdrantClient;
  private collectionName = "documents";

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || "http://localhost:6333",
      apiKey: process.env.QDRANT_API_KEY,
    });
  }

  async search(query: string, options: SearchOptions = {}): Promise<RetrievalResponse> {
    const startTime = Date.now();
    const limit = options.limit || 10;
    const scoreThreshold = options.scoreThreshold || 0.0;
    
    // 1. Generate query embedding
    // We access the provider directly to embed a single string without Chunk mapping
    const queryVector = await geminiEmbeddingProvider.generateEmbedding(query);

    // 2. Build Qdrant Filters
    const mustFilters: any[] = [];
    
    if (options.workspaceId) {
      mustFilters.push({ key: "workspaceId", match: { value: options.workspaceId } });
    }
    
    if (options.documentId) {
      mustFilters.push({ key: "documentId", match: { value: options.documentId } });
    }
    
    if (options.language) {
      mustFilters.push({ key: "language", match: { value: options.language } });
    }

    const filter = mustFilters.length > 0 ? { must: mustFilters } : undefined;

    // 3. Qdrant Search (Fetch Top 20 for reranking if limit < 20, else fetch limit * 2)
    const initialFetchLimit = Math.max(20, limit * 2);

    const searchResults = await this.client.search(this.collectionName, {
      vector: queryVector,
      limit: initialFetchLimit,
      filter: filter,
      score_threshold: scoreThreshold,
    });

    // Map to RetrievedChunk interface
    let chunks: RetrievedChunk[] = searchResults.map(res => {
      const payload = res.payload as any;
      return {
        id: res.id,
        score: res.score,
        workspaceId: payload.workspaceId,
        documentId: payload.documentId,
        documentName: payload.documentName,
        source: payload.source,
        pageNumber: payload.pageNumber,
        chunkIndex: payload.chunkIndex,
        language: payload.language,
        section: payload.section,
        text: payload.text,
        wordCount: payload.wordCount,
      };
    });

    // 4. Re-Ranking Hook
    chunks = await this.reRankResults(query, chunks);

    // 5. Slice to requested limit
    chunks = chunks.slice(0, limit);

    const executionTimeMs = Date.now() - startTime;
    
    const scores = chunks.map(c => c.score);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    const metrics: RetrievalMetrics = {
      executionTimeMs,
      totalReturned: chunks.length,
      averageScore,
      highestScore,
      lowestScore,
      embeddingModelUsed: geminiEmbeddingProvider.defaultModel,
      collectionName: this.collectionName,
    };

    return {
      query,
      chunks,
      metrics
    };
  }

  /**
   * Placeholder for future cross-encoder or LLM reranking models.
   * Currently just passes through the original vector similarity order.
   */
  private async reRankResults(query: string, chunks: RetrievedChunk[]): Promise<RetrievedChunk[]> {
    // In the future, send chunks.map(c => c.text) + query to a reranker API
    // Sort the chunks by the new scores and return them.
    return chunks; 
  }
}

export const retrievalService = new RetrievalService();
