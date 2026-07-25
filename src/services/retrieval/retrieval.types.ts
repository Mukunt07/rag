export interface SearchOptions {
  workspaceId?: string;
  documentId?: string;
  language?: string;
  documentTypes?: string[];
  pageRange?: { start: number; end: number };
  
  limit?: number;           // Defaults to 10
  scoreThreshold?: number;  // Defaults to 0.0
}

export interface RetrievedChunk {
  id: string | number;
  score: number;
  
  // Metadata payload
  workspaceId: string;
  documentId: string;
  documentName: string;
  source: string;
  pageNumber?: number;
  chunkIndex: number;
  language: string;
  section?: string;
  text: string;
  wordCount: number;
}

export interface RetrievalMetrics {
  executionTimeMs: number;
  totalReturned: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  embeddingModelUsed: string;
  collectionName: string;
}

export interface RetrievalResponse {
  query: string;
  chunks: RetrievedChunk[];
  metrics: RetrievalMetrics;
}
