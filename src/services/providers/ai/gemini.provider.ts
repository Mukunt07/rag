import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, AIProviderOptions } from "./ai.provider";

export class GeminiProvider implements AIProvider {
  name = "Gemini";
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. GeminiProvider will not work.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey || "");
  }

  async generateText(prompt: string, options?: AIProviderOptions): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: options?.model || "gemini-1.5-flash",
      generationConfig: {
        temperature: options?.temperature,
        maxOutputTokens: options?.maxTokens,
      }
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}

export const geminiProvider = new GeminiProvider();
