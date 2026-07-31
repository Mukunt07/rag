# Feature: Advanced Document Pipeline

## Overview
The Document Pipeline is the most complex component of the RAG system. It is responsible for taking raw file uploads, securely storing them, extracting raw text, cutting the text into semantic chunks, generating vector embeddings via AI, and indexing those vectors into a vector database for rapid retrieval.

## Tech Stack & Tools
- **File Storage**: Cloudflare R2 (via `@aws-sdk/client-s3`)
- **Metadata Database**: Neon DB (Serverless PostgreSQL via Prisma)
- **Vector Database**: Qdrant Cloud (`@qdrant/js-client-rest`)
- **Text Parsers**: `pdf-parse`, `mammoth` (for DOCX), `xlsx` (for Spreadsheets), `tesseract.js` (for OCR)
- **AI Embedding Providers**: Google Gemini API, OpenAI API

## Implementation Details
The pipeline processes files in exactly 6 stages:
1. **Downloading / Uploading**: 
   The UI uploads the file to `POST /api/documents/upload`. The backend saves the raw file to Cloudflare R2 object storage and creates a metadata record in PostgreSQL.
2. **Parsing**:
   The `ParserFactoryService` detects the file's MIME type and dynamically instantiates the correct parser class (e.g., `PdfParser`). The parser extracts raw text strings from the binary buffers.
3. **Chunking**:
   The `ChunkingService` splits the massive extracted text block into smaller, semantic "chunks" (usually 1000 characters with a 200-character overlap). Overlaps ensure context is not lost at the boundary of a cut paragraph.
4. **Embedding**:
   The `EmbeddingService` sends the chunks to the active AI provider (e.g., Gemini's `gemini-embedding-001`). The AI converts the human-readable text into dense numerical arrays (vectors) representing the semantic meaning of the text.
5. **Indexing**:
   The vectors, alongside their original source text and page numbers, are upserted into Qdrant Cloud. Qdrant organizes these vectors so they can be mathematically searched later.

## API Endpoints
- **POST `/api/documents/upload`**: Accepts `multipart/form-data`. Uploads to R2 and synchronously awaits the parsing and embedding steps before returning success.
- **GET `/api/documents?workspaceId={id}`**: Fetches metadata (name, size, date) of all documents in a workspace.
- **GET `/api/documents/[id]/download`**: Generates a temporary S3 Presigned URL to securely preview or download the raw file from Cloudflare R2.
- **DELETE `/api/documents/[id]`**: Cascading delete that removes the R2 blob, Prisma metadata, and the Qdrant vectors.

## UI Connection
- **Components**: `src/features/dashboard/components/upload-card.tsx`, `src/features/documents/components/documents-view.tsx`
- **Workflow**:
  - The UI utilizes an invisible `<input type="file" />` disguised as a drag-and-drop card or button.
  - While the API processes the document pipeline, the UI shows a `Spinner` and intercepts potential HTTP 500 errors to show friendly UI alerts (`"Upload failed. Please check your file."`).
