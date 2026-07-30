export interface ModelConfig {
  id: string;
  provider: "gemini";
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

];
