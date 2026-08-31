import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, ProviderConfig, ProviderError } from "./ai.provider";

export class GeminiProvider implements AIProvider {
  private normalizeError(error: any): never {
    const message = error.message || String(error);
    
    if (message.includes("API key not valid") || message.includes("403")) {
      throw new ProviderError("INVALID_API_KEY", "Your API key is invalid or unauthorized. Please check your API key.");
    }
    if (message.includes("429") || message.includes("quota")) {
      throw new ProviderError("PROVIDER_LIMIT_REACHED", "Your API request was limited by the provider. Please check your API key usage, quota, or billing status.");
    }
    if (message.includes("500") || message.includes("503")) {
      throw new ProviderError("PROVIDER_UNAVAILABLE", "The AI provider is temporarily unavailable. Please try again later.");
    }
    if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
      throw new ProviderError("PROVIDER_TIMEOUT", "The request to the AI provider timed out.");
    }
    if (message.includes("model") && message.includes("not found")) {
      throw new ProviderError("MODEL_UNAVAILABLE", "The specified model is unavailable.");
    }

    throw new ProviderError("UNKNOWN_ERROR", message || "An unknown error occurred with the AI provider.");
  }

  async validateApiKey(config: ProviderConfig): Promise<boolean> {
    try {
      const genAI = new GoogleGenerativeAI(config.apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
      await model.generateContent("test");
      return true;
    } catch (error) {
      this.normalizeError(error);
    }
  }

  async generateEmbeddings(texts: string[], config: ProviderConfig): Promise<number[][]> {
    try {
      const genAI = new GoogleGenerativeAI(config.apiKey);
      const modelName = config.model || "gemini-embedding-001";
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const promises = texts.map(async (text) => {
        const result = await model.embedContent(text);
        return result.embedding.values.slice(0, 768);
      });

      return await Promise.all(promises);
    } catch (error) {
      this.normalizeError(error);
    }
  }

  async generateText(prompt: string, config: ProviderConfig): Promise<string> {
    try {
      const genAI = new GoogleGenerativeAI(config.apiKey);
      const model = genAI.getGenerativeModel({ 
        model: config.model,
        systemInstruction: config.systemPrompt,
        generationConfig: {
          temperature: config.temperature,
          topP: config.topP,
          maxOutputTokens: config.maxTokens,
        }
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      this.normalizeError(error);
    }
  }

  async generateJson<T>(prompt: string, config: ProviderConfig): Promise<T> {
    try {
      const genAI = new GoogleGenerativeAI(config.apiKey);
      const model = genAI.getGenerativeModel({ 
        model: config.model,
        systemInstruction: config.systemPrompt,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: config.temperature,
          topP: config.topP,
          maxOutputTokens: config.maxTokens,
        }
      });
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text) as T;
    } catch (error) {
      this.normalizeError(error);
    }
  }
}

export const geminiProvider = new GeminiProvider();
