# System Architecture & Tech Stack

This document details the system design, database integration, and data flow of the Knowledge Hub (RAG) project.

---

## 1. Tech Stack Summary
- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS, Framer Motion, Lucide React, shadcn/ui.
- **Backend / API**: Next.js Route Handlers (Serverless/Edge friendly), Better Auth, Prisma ORM.
- **Relational Database**: Neon PostgreSQL (Serverless Postgres).
- **Vector Database**: Qdrant Cloud / Local instance.
- **Cloud Storage**: Cloudflare R2 (Object storage with S3 compatibility).
- **AI Models**: Google Gemini API (`@google/generative-ai`) and OpenAI API (`openai`).

---

## 2. Infrastructure Architecture & Integrations

```
┌────────────────────────────────────────────────────────┐
│                   Next.js Web App UI                  │
└───────────────────────────┬────────────────────────────┘
                            │ (JSON / Multipart Form)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Next.js API Routes                   │
│       (Auth Middleware / API Key Cryptography)        │
└──────┬────────────────────┬─────────────────────┬──────┘
       │                    │                     │
       │ (SQL Query)        │ (S3 API Client)     │ (HTTP Rest / SDK)
       ▼                    ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Neon Postgres│     │Cloudflare R2 │     │ Qdrant DB    │
│  (Metadata,  │     │ (Raw file    │     │ (High-dim    │
│  users, auth)│     │ storage)     │     │ vectors)     │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Neon PostgreSQL Database
We connect via **Prisma ORM** using the `@prisma/adapter-pg` driver adapter. 
- All standard relational models (Users, Workspaces, Documents, Chat History) are managed here.
- It stores raw textual chunks (`document_chunks` table) with references to vector IDs stored in Qdrant, enabling exact content lookups after similarity searches.

### Cloudflare R2 Bucket
Cloudflare R2 is used as the document repository.
- Documents are uploaded securely using the `@aws-sdk/client-s3` library.
- Presigned download URLs are created dynamically to securely display files in the UI without exposing direct access coordinates.

### Qdrant Vector Database
Qdrant serves as the similarity search engine.
- A collection is established dynamically for each unique embedding model configuration (e.g., `documents_gemini_embedding_001`).
- The payload stored along with each vector contains fields such as `documentId`, `chunkIndex`, `text`, and `pageNumber`, facilitating fast scoped filtering and citations.

---

## 3. Data Flow Pipelines

### Upload & Processing Pipeline
1. **Upload**: User sends a file -> validation parses magic bytes -> file is optimized and uploaded to Cloudflare R2 -> metadata is saved in PostgreSQL with status `QUEUED`.
2. **Parsing**: Background worker triggers parser based on MIME-type (PDF, Word, Excel, OCR image).
3. **Chunking**: Text is split into semantic paragraphs/chunks.
4. **Embeddings**: Chunks are sent to the AI embedding model.
5. **Storage**: Vector points are sent to Qdrant; textual chunks and coordinates are saved in PostgreSQL; document status changes to `READY`.

### RAG Retrieval Pipeline
1. **Query**: User posts a message inside a workspace chat.
2. **Embedding**: The system converts the user's message into an embedding vector using the active provider's model.
3. **Search**: Query vector is matched in Qdrant with filters restricted to `documentId` present in the current workspace.
4. **Synthesis**: Top 5 semantic context snippets are compiled and combined with a custom system prompt.
5. **Generation**: The prompt is processed by the selected LLM, yielding a grounded response with source citations.
