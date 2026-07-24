import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private defaultModel = "gemini-1.5-flash";
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
    
    // Google Gemini API typically processes one at a time or in batches depending on the SDK.
    // For simplicity, we process concurrently.
    const promises = texts.map(async (text) => {
      const result = await model.embedContent(text);
      return result.embedding.values;
    });

    return Promise.all(promises);
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ 
      model: this.defaultModel,
      systemInstruction: systemInstruction,
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  async generateJson<T>(prompt: string, systemInstruction?: string): Promise<T> {
    const model = this.genAI.getGenerativeModel({ 
      model: this.defaultModel,
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

export const geminiService = new GeminiService();
