export interface DocumentMetadata {
  pageCount?: number;
  wordCount?: number;
  characterCount?: number;
  language?: string;
  hasTables: boolean;
  hasImages: boolean;
  parserUsed: string;
  extractionTimeMs: number;
  ocrUsed?: boolean;
  extractionConfidence?: number;
}

export interface Page {
  pageNumber: number;
  text: string;
}

export interface Table {
  pageNumber?: number;
  data: string[][];
  markdown: string;
}

export interface ImageReference {
  pageNumber?: number;
  altText?: string;
  buffer?: Buffer;
}

export interface ParsedDocument {
  text: string;
  pages: Page[];
  metadata: DocumentMetadata;
  tables: Table[];
  images: ImageReference[];
}
