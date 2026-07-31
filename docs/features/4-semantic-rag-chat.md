# Feature: Semantic RAG Chat

## Overview
Retrieval-Augmented Generation (RAG) is the feature that allows the AI to "read" the user's uploaded documents and answer questions based solely on that context. It also maintains conversational memory so the user can ask follow-up questions.

## Tech Stack & Tools
- **Vector Search Engine**: Qdrant Cloud (`@qdrant/js-client-rest`)
- **AI Text Generation**: Google Gemini (`@google/generative-ai`), OpenAI (`openai`)
- **Database**: Neon DB (Serverless PostgreSQL via Prisma)
- **Formatting**: `react-markdown`, `remark-gfm`

## Implementation Details
1. **Chat Persistence**:
   The `POST /api/chat` endpoint automatically retrieves (or creates) a strict 1-to-1 `ChatSession` for the current user and active Workspace using an atomic DB `upsert`. This prevents race conditions and ensures all workspace context remains in a single timeline.
2. **Vector Similarity Search**:
   When a user asks a question (e.g., "What is the company's revenue?"), the `RagService` converts that exact question into a Vector Embedding using the user's AI provider. It then performs a Cosine Similarity Search in Qdrant to find the 5 closest document chunks (paragraphs) mathematically identical to the question's intent.
3. **Context Ingestion**:
   The top 5 document chunks are retrieved. A massive backend "System Prompt" is formulated containing the raw text of those chunks, instructing the AI to read them and answer the user's question without hallucinating.
4. **Source Attribution**:
   The AI responds to the user, and the backend attaches the exact File IDs and Page Numbers of the chunks it found.

## API Endpoints
- **GET `/api/chat?workspaceId={id}`**: Retrieves the persistent `ChatMessage` history for the active workspace to populate the UI upon page load.
- **POST `/api/chat`**: 
  1. Embeds the user's query.
  2. Searches Qdrant for context.
  3. Queries the LLM for the answer.
  4. Saves both the user message and assistant reply to PostgreSQL.
  5. Returns the synthesized markdown answer and citation sources.

## UI Connection
- **Components**: `src/features/workspaces/components/workspace-view.tsx`
- **Workflow**:
  - The UI uses `<ReactMarkdown>` to render the AI's response properly (bolding, lists, paragraphs).
  - The UI iterates through the returned `msg.sources` and renders interactive "Source Citation" chips below the chat bubble.
  - Clicking a source chip opens an inspector modal showing the exact extracted text paragraph and a button to load the full original PDF.
