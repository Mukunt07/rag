export interface EmbeddingProvider {
  name: string;
  defaultModel: string;
  
  generateEmbedding(text: string, model?: string): Promise<number[]>;
  generateEmbeddings(texts: string[], model?: string): Promise<number[][]>;
}
