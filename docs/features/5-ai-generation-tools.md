# Feature: AI Generation Tools (Summaries, Notes, Quizzes)

## Overview
Beyond conversational RAG, the application offers purpose-built AI tools to digest long documents into study materials. Users can generate executive summaries, study guides, interactive flashcards, and multiple-choice quizzes automatically from their uploaded documents.

## Tech Stack & Tools
- **AI Generators**: Gemini and OpenAI Models
- **Database**: Neon DB (Serverless PostgreSQL) (Prisma models: `AiGeneration`, `SavedArtifact`)
- **UI Components**: React State, Tailwind Animations

## Implementation Details
1. **Document Selection**: 
   The user selects a target document in the UI. The backend fetches the raw text chunks of that document directly from PostgreSQL (without needing a semantic Qdrant search, because the user explicitly wants the whole document parsed).
2. **Specialized Prompts**:
   Depending on the requested tool (e.g., "Flashcards" vs "Summary"), a highly specific system prompt is used. For Flashcards and Quizzes, the AI is instructed to return strict JSON arrays instead of markdown, ensuring the frontend can parse the questions and answers into interactive UI cards.
3. **Artifact Saving**:
   Once generated, the output is saved in the `SavedArtifact` database table. This allows users to revisit their generated quizzes or notes at any time without paying AI API costs to regenerate them.

## API Endpoints
- **POST `/api/ai/generate`**: The unified endpoint for triggering a specific AI pipeline (`summary`, `notes`, `flashcards`, `quiz`). It accepts the `documentId` and `type`.
- **GET `/api/artifacts?workspaceId={id}`**: Retrieves previously saved generations for the active workspace.

## UI Connection
- **Components**: `src/features/notes/components/notes-view.tsx`, `src/features/quiz/components/quiz-view.tsx`
- **Workflow**:
  - The Notes View shows a rich text editor or formatted markdown pane containing the generated summary.
  - The Quiz View parses the returned JSON string into a React state array. It tracks the user's score, displaying one question at a time and flipping flashcards using CSS transforms (`tw-animate-css` / Tailwind).
