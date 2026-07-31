import { QdrantClient } from "@qdrant/js-client-rest";
import { ProviderResolver } from "./provider.resolver";
import { prisma } from "@/lib/prisma";
import { AIProviderId } from "./models.registry";

export class RagService {
  private qdrantClient: QdrantClient;

  constructor() {
    this.qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL || "http://localhost:6333",
      apiKey: process.env.QDRANT_API_KEY,
    });
  }

  async ensureCollection(collectionName: string, vectorSize: number = 768) {
    try {
      await this.qdrantClient.getCollection(collectionName);
    } catch {
      await this.qdrantClient.createCollection(collectionName, {
        vectors: {
          size: vectorSize, // Adjust size depending on the embedding model used
          distance: "Cosine",
        },
      });
      await this.qdrantClient.createPayloadIndex(collectionName, {
        field_name: "documentId",
        field_schema: "keyword",
        wait: true,
      });
    }
  }

  async indexChunks(userId: string, documentId: string, chunks: { text: string; chunkIndex: number; pageNumber?: number }[]) {
    let apiKeyRecord = await (prisma as any).userApiKey.findFirst({
      where: { userId, isDefault: true }
    });
    if (!apiKeyRecord) {
      apiKeyRecord = await (prisma as any).userApiKey.findFirst({ where: { userId } });
    }
    if (!apiKeyRecord) {
      throw new Error("No API key configured for generating embeddings. Please set up a provider in Settings.");
    }
    const providerId = apiKeyRecord.provider as AIProviderId;
    const modelId = providerId === "openai" ? "text-embedding-3-small" : "gemini-embedding-001";
    const collectionName = `documents_${modelId.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const { provider, config } = await ProviderResolver.resolve(userId, providerId, modelId);

    const embeddings = await provider.generateEmbeddings(chunks.map(c => c.text), config);

    await this.ensureCollection(collectionName, embeddings[0]?.length || 768);

    const points = chunks.map((chunk, i) => {
      const vectorId = crypto.randomUUID();
      return {
        id: vectorId,
        vector: embeddings[i],
        payload: {
          documentId,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          pageNumber: chunk.pageNumber,
        },
      };
    });

    await this.qdrantClient.upsert(collectionName, {
      wait: true,
      points,
    });

    const dbChunks = points.map(p => ({
      documentId,
      chunkIndex: p.payload.chunkIndex as number,
      content: p.payload.text as string,
      tokenCount: 0,
      vectorId: p.id,
      embeddingModel: config.model,
      pageNumber: p.payload.pageNumber as number | undefined,
    }));

    await prisma.documentChunk.createMany({
      data: dbChunks,
    });
  }

  async searchAndAnswer(
    query: string, 
    workspaceId: string, 
    userId: string,
    options?: { provider?: string; model?: string }
  ): Promise<{ answer: string; sources: any[] }> {
    const providerId = (options?.provider || "gemini") as AIProviderId;
    const modelId = options?.model;

    const { provider, config } = await ProviderResolver.resolve(userId, providerId, modelId);

    // Ensure we use the embedding model correctly. Usually embeddings have a different model id.
    // For simplicity, we fallback to a default embedding model resolver if needed.
    const embeddingModel = providerId === "openai" ? "text-embedding-3-small" : "gemini-embedding-001";
    const queryEmbedding = (await provider.generateEmbeddings([query], { ...config, model: embeddingModel }))[0];
    const collectionName = `documents_${embeddingModel.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    const workspaceDocs = await prisma.document.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true }
    });
    
    const docIds = workspaceDocs.map(d => d.id);

    const searchResults = await this.qdrantClient.search(collectionName, {
      vector: queryEmbedding,
      limit: 5,
      filter: {
        must: [
          { key: "documentId", match: { any: docIds } }
        ]
      }
    });

    const sources = searchResults.map(r => r.payload);

    const contextString = sources.map((s: any) => `[Doc ${s.documentId}, Chunk ${s.chunkIndex}]: ${s.text}`).join("\n\n");

    const systemPrompt = `You are a helpful knowledge assistant. Use the following extracted context to answer the user's query. 
Format your answer in well-structured, fluent sentences and paragraphs. Avoid returning raw, fragmented bullet points or outlines unless specifically requested. Cite your sources if possible.

Context:
${contextString}
`;

    const answer = await provider.generateText(query, { ...config, systemPrompt });

    return { answer, sources };
  }
}

export const ragService = new RagService();
