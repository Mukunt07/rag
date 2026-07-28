import { GoogleGenerativeAI } from "@google/generative-ai";
import { LLMProvider } from "./llm.interface";

export class GeminiProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI;
  private embeddingModel = "text-embedding-004";

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. AI features will not work.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey || "");
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const model = this.genAI.getGenerativeModel({ model: this.embeddingModel });
    
    const promises = texts.map(async (text) => {
      const result = await model.embedContent(text);
      return result.embedding.values;
    });

    return Promise.all(promises);
  }

  async generateText(prompt: string, modelId: string, systemInstruction?: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ 
      model: modelId,
      systemInstruction: systemInstruction,
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  async generateJson<T>(prompt: string, modelId: string, systemInstruction?: string): Promise<T> {
    const model = this.genAI.getGenerativeModel({ 
      model: modelId,
      systemInstruction: systemInstruction,
      generationConfig: {
        responseMimeType: "application/json"
      }
    });
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as T;
  }
}

export const geminiProvider = new GeminiProvider();
