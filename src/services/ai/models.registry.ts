export type AIProviderId = "gemini" | "openai" | "anthropic";

export interface ModelConfig {
  id: string;
  provider: AIProviderId;
  displayName: string;
  supportsVision: boolean;
  supportsEmbeddings: boolean;
  contextWindow: number;
  recommended: boolean;
}

export const MODELS: ModelConfig[] = [
  {
    id: "gemini-1.5-flash",
    provider: "gemini",
    displayName: "Gemini 1.5 Flash",
    supportsVision: true,
    supportsEmbeddings: false,
    contextWindow: 1000000,
    recommended: true,
  },
  {
    id: "gemini-2.5-pro",
    provider: "gemini",
    displayName: "Gemini 2.5 Pro",
    supportsVision: true,
    supportsEmbeddings: false,
    contextWindow: 2000000,
    recommended: false,
  },
  {
    id: "text-embedding-004",
    provider: "gemini",
    displayName: "Gemini Text Embedding",
    supportsVision: false,
    supportsEmbeddings: true,
    contextWindow: 2048,
    recommended: true,
  },
  {
    id: "gpt-4o",
    provider: "openai",
    displayName: "GPT-4o",
    supportsVision: true,
    supportsEmbeddings: false,
    contextWindow: 128000,
    recommended: true,
  },
  {
    id: "gpt-4o-mini",
    provider: "openai",
    displayName: "GPT-4o Mini",
    supportsVision: true,
    supportsEmbeddings: false,
    contextWindow: 128000,
    recommended: false,
  },
  {
    id: "text-embedding-3-small",
    provider: "openai",
    displayName: "OpenAI Text Embedding 3",
    supportsVision: false,
    supportsEmbeddings: true,
    contextWindow: 8191,
    recommended: true,
  }
];

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODELS.find((m) => m.id === modelId);
}

export function getModelsForProvider(providerId: AIProviderId): ModelConfig[] {
  return MODELS.filter((m) => m.provider === providerId);
}
