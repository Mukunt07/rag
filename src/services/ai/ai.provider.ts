export interface ProviderConfig {
  apiKey: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface AIProvider {
  generateText(prompt: string, config: ProviderConfig): Promise<string>;
  generateJson<T>(prompt: string, config: ProviderConfig): Promise<T>;
  generateEmbeddings(texts: string[], config: ProviderConfig): Promise<number[][]>;
}
