import { QdrantClient } from "@qdrant/js-client-rest";
import { ProviderResolver } from "../ai/provider.resolver";
import { prisma } from "@/lib/prisma";
import { AIProviderId } from "../ai/models.registry";
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

  async search(userId: string, query: string, options: SearchOptions = {}): Promise<RetrievalResponse> {
    const startTime = Date.now();
    const limit = options.limit || 10;
    const scoreThreshold = options.scoreThreshold || 0.0;
    
    // 1. Generate query embedding
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
    const modelId = providerId === "openai" ? "text-embedding-3-small" : "gemini-embedding-001";

    const { provider, config } = await ProviderResolver.resolve(userId, providerId, modelId);
    
    const vectors = await provider.generateEmbeddings([query], config);
    const queryVector = vectors[0];

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

    const collectionName = `documents_${modelId.replace(/[^a-zA-Z0-9]/g, '_')}`;

    let searchResults: any[] = [];
    try {
      searchResults = await this.client.search(collectionName, {
        vector: queryVector,
        limit: initialFetchLimit,
        filter: filter,
        score_threshold: scoreThreshold,
      });
    } catch (err: any) {
      // Return empty results gracefully if the Qdrant collection does not exist yet (e.g. fresh environment)
      const errStr = String(err).toLowerCase();
      if (errStr.includes("not found") || errStr.includes("404")) {
        searchResults = [];
      } else {
        throw err;
      }
    }

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
      embeddingModelUsed: config.model || modelId,
      collectionName: collectionName,
    };

    return {
      query,
      chunks,
      metrics
    };
  }

  private async reRankResults(query: string, chunks: RetrievedChunk[]): Promise<RetrievedChunk[]> {
    return chunks; 
  }
}

export const retrievalService = new RetrievalService();
