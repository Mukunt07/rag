# Feature: Chat History Persistence

## Overview
The Chat History Persistence feature ensures that user conversations within a workspace are seamlessly saved, synchronized, and re-loaded across browser refreshes and session restarts. 

## Architectural Decisions
We implemented this feature using **Option A: Exactly ONE ChatSession per Workspace per User**.
This design implies that all queries a user makes within a specific workspace are treated as a continuous, unified conversation thread.

### Database Strategy
- **Unique Constraints**: A strict database-level compound constraint `@@unique([workspaceId, createdById])` was added to the `ChatSession` model in PostgreSQL (via Prisma).
- **Benefits**:
  - Prevents race conditions from generating duplicate sessions for a single user/workspace combination.
  - Ensures absolute consistency on the backend.

### Backend Endpoints
- **GET `/api/chat`**:
  - Accepts a `workspaceId` URL parameter.
  - Resolves the exact `ChatSession` using the unique compound key (`workspaceId_createdById`).
  - Retrieves all historical `ChatMessage` entities natively sorted by `createdAt ASC` and `id ASC` to guarantee stability.
- **POST `/api/chat`**:
  - Automatically provisions or retrieves the active session atomically using Prisma's `upsert` mechanism.
  - Writes the User prompt and the AI Assistant reply (including sources/citations) directly into the database.
  - Eliminates the need for the frontend to manually generate, track, or post `sessionId` references.

### Frontend Synchronization
- **Component**: `WorkspaceView` (`src/features/workspaces/components/workspace-view.tsx`)
- **Behavior**:
  - Listens for changes in the active `workspaceId`.
  - Instantly resets the chat UI layout to a fallback Welcome Message to prevent visual artifacts or flickering between workspaces.
  - Invokes `GET /api/chat` in the background and populates the history.
  - Utilizes optimistic UI rendering on new messages to provide a snappy, real-time feel while the background synchronizes to the DB.
