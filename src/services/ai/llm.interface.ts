export interface LLMProvider {
  generateText(prompt: string, modelId: string, systemInstruction?: string): Promise<string>;
  generateJson<T>(prompt: string, modelId: string, systemInstruction?: string): Promise<T>;
}
