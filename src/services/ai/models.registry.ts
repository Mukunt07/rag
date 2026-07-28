export interface ModelConfig {
  id: string;
  provider: "gemini" | "ollama";
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
    id: "qwen2.5:7b",
    provider: "ollama",
    displayName: "Qwen 2.5 7B (Local)",
  },
];
