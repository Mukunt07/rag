import ollama from "ollama";
import { LLMProvider } from "./llm.interface";

export class OllamaProvider implements LLMProvider {
  async generateText(prompt: string, modelId: string, systemInstruction?: string): Promise<string> {
    const response = await ollama.generate({
      model: modelId,
      prompt: prompt,
      system: systemInstruction,
    });
    return response.response;
  }

  async generateJson<T>(prompt: string, modelId: string, systemInstruction?: string): Promise<T> {
    const response = await ollama.generate({
      model: modelId,
      prompt: prompt,
      system: systemInstruction,
      format: "json",
    });
    return JSON.parse(response.response) as T;
  }
}

export const ollamaProvider = new OllamaProvider();
