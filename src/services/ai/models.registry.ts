export type AIProviderId = "gemini" | "openai" | "anthropic";

export interface ModelConfig {
  id: string;
  provider: AIProviderId;
  displayName: string;
}

export const MODELS: ModelConfig[] = [
  {
    id: "gemini-1.5-flash",
    provider: "gemini",
    displayName: "Gemini 1.5 Flash",
  },
  {
    id: "gemini-2.5-pro",
    provider: "gemini",
    displayName: "Gemini 2.5 Pro",
  },
  {
    id: "gpt-4o",
    provider: "openai",
    displayName: "GPT-4o",
  },
  {
    id: "gpt-4o-mini",
    provider: "openai",
    displayName: "GPT-4o Mini",
  }
];

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODELS.find((m) => m.id === modelId);
}
