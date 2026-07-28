import { LLMProvider } from "./llm.interface";
import { geminiProvider } from "./gemini.service";
import { ollamaProvider } from "./ollama.service";

export function getLLMProvider(providerId: string): LLMProvider {
  switch (providerId) {
    case "gemini":
      return geminiProvider;
    case "ollama":
      return ollamaProvider;
    default:
      throw new Error(`Unsupported LLM provider: ${providerId}`);
  }
}
