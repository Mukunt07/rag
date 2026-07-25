import { GoogleGenerativeAI } from "@google/generative-ai";
import { EmbeddingProvider } from "./embedding.provider";

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  name = "Gemini";
  defaultModel = "text-embedding-004";
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. GeminiEmbeddingProvider will not work.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey || "");
  }

  async generateEmbedding(text: string, model?: string): Promise<number[]> {
    const aiModel = this.genAI.getGenerativeModel({ model: model || this.defaultModel });
    const result = await aiModel.embedContent(text);
    return result.embedding.values;
  }

  async generateEmbeddings(texts: string[], model?: string): Promise<number[][]> {
    // Gemini API supports batch embedding natively but the SDK uses `batchEmbedContents`
    const aiModel = this.genAI.getGenerativeModel({ model: model || this.defaultModel });
    const requests = texts.map((t) => ({ content: { role: "user", parts: [{ text: t }] } }));
    
    // Process in batches if there are many texts (Gemini has limits per request)
    // For simplicity, assuming a small enough batch for now, or you'd chunk this array.
    const result = await aiModel.batchEmbedContents({
      requests,
    });
    
    return result.embeddings.map((e) => e.values);
  }
}

export const geminiEmbeddingProvider = new GeminiEmbeddingProvider();
