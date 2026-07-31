# Feature: Workspace Management

## Overview
Workspaces serve as the core organizational unit of the application. They allow a single user to create distinct environments to isolate documents, chat histories, and AI settings for different projects or subjects.

## Tech Stack & Tools
- **Framework:** Next.js 16
- **Database:** Neon DB (Serverless PostgreSQL via Prisma ORM)
- **UI State:** React Context/State
- **Data Fetching:** Native fetch API

## Implementation Details
1. **Data Segregation**: 
   Every core entity in the database (`Document`, `ChatSession`, `SavedArtifact`) holds a foreign key to a `Workspace`. This ensures strict boundaries so that querying documents inside "Workspace A" will never retrieve vectors from "Workspace B".
2. **Custom Settings**:
   Each workspace is attached to a `WorkspaceSetting` model. This allows users to configure specific behaviors (e.g., using Gemini for Workspace A, and OpenAI for Workspace B, alongside custom chunking sizes).
3. **Default Workspaces**:
   When a user logs in and uploads their first document, the backend checks if they have a workspace. If not, it automatically provisions a "default-workspace" to ensure frictionless onboarding.

## API Endpoints
- **GET `/api/workspaces`**: Returns a list of all workspaces owned by the authenticated user.
- **POST `/api/workspaces`**: Creates a new workspace.
- **GET `/api/workspaces/[id]`**: Retrieves details and settings for a specific workspace.
- **PATCH `/api/workspaces/[id]/settings`**: Updates the AI provider and prompt settings for the workspace.

## UI Connection
- **Components**: `src/features/dashboard/components/workspace-card.tsx`, `src/features/workspaces/components/workspace-view.tsx`
- **Workflow**:
  - The Dashboard UI calls `GET `/api/workspaces` to list available projects.
  - Clicking a workspace routes the user to `/workspaces/[id]`.
  - The `WorkspaceView` component extracts the `[id]` from the URL parameter and uses it across all subsequent API calls (e.g., fetching documents or sending chat messages scoped exclusively to that workspace).
