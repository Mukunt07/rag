import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, ProviderConfig } from "./ai.provider";

export class GeminiProvider implements AIProvider {
  async generateEmbeddings(texts: string[], config: ProviderConfig): Promise<number[][]> {
    const genAI = new GoogleGenerativeAI(config.apiKey);
    // Use the provided embedding model or fallback
    const modelName = config.model || "gemini-embedding-001";
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const promises = texts.map(async (text) => {
      const result = await model.embedContent(text);
      // Gemini-embedding-001 supports Matryoshka Representation Learning
      // Truncating to 768 dimensions gives a valid embedding that matches our Qdrant collection size
      return result.embedding.values.slice(0, 768);
    });

    return Promise.all(promises);
  }

  async generateText(prompt: string, config: ProviderConfig): Promise<string> {
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
  }

  async generateJson<T>(prompt: string, config: ProviderConfig): Promise<T> {
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
  }
}

export const geminiProvider = new GeminiProvider();
