# Project Features & Functionalities

This document details the core features and user-facing functionalities implemented in the Knowledge Hub (RAG) project.

---

## 1. Multi-Tenant User Authentication
* **Powered by**: Better Auth (`better-auth`)
* **Functionality**:
  - Secure sign-up, sign-in, and session management.
  - Integration with the database (`User`, `Session`, `Account`, and `Verification` tables in PostgreSQL) to persist credentials and sessions.
  - Next.js middleware protection (`src/middleware.ts`) to intercept unauthorized requests and redirect users to login pages.

---

## 2. Workspace Management
* **Database Models**: `Workspace`, `WorkspaceSetting`
* **Functionality**:
  - Multi-tenant data segregation. Users can create multiple workspaces to group documents and chat sessions.
  - Workspace-level settings to configure:
    - Default Large Language Model (LLM).
    - Default Embedding Model.
    - Temperature settings.
    - Custom System Prompts.
    - Chunking configuration parameters (e.g., custom chunk size).

---

## 3. Advanced Document Pipeline
* **Storage**: Cloudflare R2 (S3 API Client)
* **Metadata Database**: Neon PostgreSQL (via Prisma)
* **Processing Workflow**:
  1. **Upload & Validation**: Handled by `UploadService`. Checks magic bytes to verify MIME-types securely, calculates SHA-256 checksums to detect duplicate uploads, and saves the file directly to Cloudflare R2 using presigned URLs.
  2. **Optimization**: Compresses and optimizes incoming documents to reduce storage cost and speed up reading.
  3. **Universal Document Parser**: A factory pattern (`ParserFactoryService`) resolves the correct parser for different file formats:
     - **PDFs**: Text extraction via `pdf-parse` / `pdf-lib`.
     - **Word (`.docx`)**: Text extraction using `mammoth`.
     - **Excel (`.xlsx`/`.csv`)**: Grid-level cell parsing using `xlsx`.
     - **Images**: OCR text extraction using `tesseract.js`.
  4. **Text Chunking**: `ChunkingService` splits the extracted text into optimal semantic chunks using custom character overlaps and token-aware bounds.
  5. **Embedding Generation**: Sends chunks to the user's active embedding model provider (e.g., Google Gemini or OpenAI) to generate vector embeddings.
  6. **Vector Indexing**: Registers vectors as searchable points in **Qdrant Vector DB** and inserts textual nodes into the PostgreSQL `document_chunks` table.

---

## 4. Semantic Chat & Retrieval-Augmented Generation (RAG)
* **Database Models**: `ChatSession`, `ChatMessage`
* **Service**: `RagService`
* **Functionality**:
  - **Conversational Memory**: Stores message histories inside `ChatSession` and `ChatMessage` tables.
  - **Vector Querying**: Embeds incoming chat messages and performs Cosine similarity search against the user's document vectors in Qdrant.
  - **Access Controls**: The query is dynamically scoped so that results are filtered exclusively to document IDs associated with the active Workspace.
  - **Source Citations**: Returns references (with file titles, pages, and chunk numbers) indicating where the retrieved data originated.
  - **AI Context Ingestion**: Formulates a system prompt using retrieved chunks to generate highly context-aware responses.

---

## 5. AI Notes & Summary Generation
* **Database Model**: `AiGeneration`, `SavedArtifact`
* **Functionality**:
  - Automatically summarizes lengthy documents into readable outlines.
  - Generates study guides, mindmaps, translations, timelines, and study notes.
  - Saves the generated documents as reusable artifacts (`SavedArtifact`) within the workspace.

---

## 6. Interactive Quizzes & Flashcards
* **Database Model**: `SavedArtifact`
* **Functionality**:
  - Automatically analyzes document text and creates quiz questions (multiple-choice or fill-in-the-blank).
  - Generates interactive flashcard decks for testing comprehension.
  - Tracks user progress and saves customized study sets directly inside the active workspace.

---

## 7. AI Provider Settings
* **Database Model**: `UserApiKey`
* **Functionality**:
  - Let users bring their own API keys for **Google Gemini** and **OpenAI**.
  - Encrypts API keys securely at rest using AES-256 (`API_KEY_ENCRYPTION_KEY`).
  - Supports live connection tests (`src/app/api/settings/providers/test/route.ts`) to validate API keys before saving.
  - Allows selecting default models for text generation and embeddings workspace-wide or user-wide.
