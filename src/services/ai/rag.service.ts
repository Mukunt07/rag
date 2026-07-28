import { QdrantClient } from "@qdrant/js-client-rest";
import { geminiProvider } from "./gemini.service";
import { getLLMProvider } from "./llm.factory";
import { prisma } from "@/lib/prisma";

export class RagService {
  private qdrantClient: QdrantClient;
  private collectionName = "documents";

  constructor() {
    this.qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL || "http://localhost:6333",
      apiKey: process.env.QDRANT_API_KEY,
    });
  }

  async ensureCollection() {
    try {
      await this.qdrantClient.getCollection(this.collectionName);
    } catch {
      await this.qdrantClient.createCollection(this.collectionName, {
        vectors: {
          size: 768, // text-embedding-004 vector size
          distance: "Cosine",
        },
      });
    }
  }

  async indexChunks(documentId: string, chunks: { text: string; chunkIndex: number; pageNumber?: number }[]) {
    await this.ensureCollection();

    const embeddings = await geminiProvider.generateEmbeddings(chunks.map(c => c.text));

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

    await this.qdrantClient.upsert(this.collectionName, {
      wait: true,
      points,
    });

    // Save metadata to Prisma
    const dbChunks = points.map(p => ({
      documentId,
      chunkIndex: p.payload.chunkIndex as number,
      content: p.payload.text as string,
      tokenCount: 0, // Simplified for now
      vectorId: p.id,
      embeddingModel: "text-embedding-004",
      pageNumber: p.payload.pageNumber as number | undefined,
    }));

    await prisma.documentChunk.createMany({
      data: dbChunks,
    });
  }

  async searchAndAnswer(
    query: string, 
    workspaceId: string, 
    options?: { provider?: string; model?: string }
  ): Promise<{ answer: string; sources: any[] }> {
    const providerId = options?.provider || "gemini";
    const modelId = options?.model || "gemini-1.5-flash";

    // 1. Retrieve using Gemini embeddings (maintaining consistency)
    const queryEmbedding = (await geminiProvider.generateEmbeddings([query]))[0];
    
    // We should filter by documentIds that belong to this workspace
    const workspaceDocs = await prisma.document.findMany({
      where: { workspaceId },
      select: { id: true }
    });
    
    const docIds = workspaceDocs.map(d => d.id);

    const searchResults = await this.qdrantClient.search(this.collectionName, {
      vector: queryEmbedding,
      limit: 5,
      filter: {
        must: [
          { key: "documentId", match: { any: docIds } }
        ]
      }
    });

    const sources = searchResults.map(r => r.payload);

    // 2. Build Context
    const contextString = sources.map((s: any) => `[Doc ${s.documentId}, Chunk ${s.chunkIndex}]: ${s.text}`).join("\n\n");

    // 3. Call selected LLM Provider
    const systemPrompt = `You are a helpful knowledge assistant. Use the following extracted context to answer the user's query. Cite your sources if possible.
Context:
${contextString}
`;

    const llmProvider = getLLMProvider(providerId);
    const answer = await llmProvider.generateText(query, modelId, systemPrompt);

    // 4. Return Citation
    return { answer, sources };
  }
}

export const ragService = new RagService();
