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
    let apiKeyRecord = await prisma.userApiKey.findFirst({
      where: { userId, provider: { in: ["gemini", "openai"] }, isDefault: true }
    });
    if (!apiKeyRecord) {
      apiKeyRecord = await prisma.userApiKey.findFirst({
        where: { userId, provider: { in: ["gemini", "openai"] } }
      });
    }
    if (!apiKeyRecord) {
      throw new Error("No API key configured for generating embeddings. Please set up Gemini or OpenAI in Settings.");
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

    // 1. Resolve Chat Generation Provider (can be gemini, openai, or groq)
    const { provider: chatProvider, config: chatConfig } = await ProviderResolver.resolve(userId, providerId, modelId);

    // 2. Resolve Embedding Provider (must be gemini or openai)
    let embedApiKeyRecord = await prisma.userApiKey.findFirst({
      where: { userId, provider: { in: ["gemini", "openai"] }, isDefault: true }
    });
    if (!embedApiKeyRecord) {
      embedApiKeyRecord = await prisma.userApiKey.findFirst({
        where: { userId, provider: { in: ["gemini", "openai"] } }
      });
    }
    if (!embedApiKeyRecord) {
      throw new Error("No embedding provider (Gemini or OpenAI) configured in Settings.");
    }
    const embedProviderId = embedApiKeyRecord.provider as AIProviderId;
    const embeddingModel = embedProviderId === "openai" ? "text-embedding-3-small" : "gemini-embedding-001";
    const collectionName = `documents_${embeddingModel.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const { provider: embedProvider, config: embedConfig } = await ProviderResolver.resolve(userId, embedProviderId, embeddingModel);
    
    const workspaceDocs = await prisma.document.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true }
    });
    
    const docIds = workspaceDocs.map(d => d.id);

    if (docIds.length === 0) {
      const systemPrompt = `You are a helpful knowledge assistant. Note that there are currently no documents in this workspace. Explain to the user that they can upload documents to get context-aware answers, and answer their query directly using your general knowledge.`;
      const answer = await chatProvider.generateText(query, { ...chatConfig, systemPrompt });
      return { answer, sources: [] };
    }

    let searchResults: any[] = [];
    try {
      searchResults = await this.qdrantClient.search(collectionName, {
        vector: (await embedProvider.generateEmbeddings([query], embedConfig))[0],
        limit: 5,
        filter: {
          must: [
            { key: "documentId", match: { any: docIds } }
          ]
        }
      });
    } catch (err: any) {
      const errStr = String(err).toLowerCase();
      if (errStr.includes("not found") || errStr.includes("404")) {
        searchResults = [];
      } else {
        throw err;
      }
    }

    const sources = searchResults.map(r => r.payload);

    const contextString = sources.map((s: any) => `[Doc ${s.documentId}, Chunk ${s.chunkIndex}]: ${s.text}`).join("\n\n");

    const systemPrompt = `You are a helpful knowledge assistant. Use the following extracted context to answer the user's query. 
Format your answer in well-structured, fluent sentences and paragraphs. Avoid returning raw, fragmented bullet points or outlines unless specifically requested.
CRITICAL RULE: DO NOT include raw citation brackets (e.g., [Doc ID, Chunk X]) in your response text. Synthesize the information naturally. The user interface will automatically display the source citations below your response.

Context:
${contextString}
`;

    const answer = await chatProvider.generateText(query, { ...chatConfig, systemPrompt });

    return { answer, sources };
  }
}

export const ragService = new RagService();
