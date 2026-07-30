import { LLMProvider } from "./llm.interface";
import { geminiProvider } from "./gemini.service";

export function getLLMProvider(providerId: string): LLMProvider {
  switch (providerId) {
    case "gemini":
      return geminiProvider;

    default:
      throw new Error(`Unsupported LLM provider: ${providerId}`);
  }
}
