export interface ProviderConfig {
  apiKey: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export type ProviderErrorCode = 
  | "INVALID_API_KEY"
  | "PROVIDER_LIMIT_REACHED"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "MODEL_UNAVAILABLE"
  | "UNKNOWN_ERROR";

export class ProviderError extends Error {
  code: ProviderErrorCode;
  
  constructor(code: ProviderErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "ProviderError";
  }
}

export interface AIProvider {
  generateText(prompt: string, config: ProviderConfig): Promise<string>;
  generateJson<T>(prompt: string, config: ProviderConfig): Promise<T>;
  generateEmbeddings(texts: string[], config: ProviderConfig): Promise<number[][]>;
  validateApiKey(config: ProviderConfig): Promise<boolean>;
}
