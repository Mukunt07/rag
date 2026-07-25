export interface AIProvider {
  name: string;
  generateText(prompt: string, options?: AIProviderOptions): Promise<string>;
}

export interface AIProviderOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
