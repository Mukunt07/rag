# Feature: UI Error Masking & Bug Fixes

## Overview
To improve the user experience and maintain application security, all raw backend errors (e.g., database constraint violations, AI provider timeouts, internal 500 status codes) are intercepted before reaching the UI. 

Instead of showing intimidating stack traces or exact server errors, the UI gracefully falls back to displaying polite, context-aware error messages. The raw errors are simultaneously logged to the browser's developer console for debugging purposes.

## Implementation Details

### 1. Chat Workspace Exceptions
- **File**: `src/features/workspaces/components/workspace-view.tsx`
- **Behavior**: If a user's chat prompt fails (due to network failure, API rate limits, etc.), the application suppresses the default `err.message`.
- **User-Facing Fallback**: An AI-themed message bubble appears stating: `"I'm sorry, I encountered an issue while processing your request. Please try again later."`

### 2. Document Uploads
- **Files**: 
  - `src/features/workspaces/components/workspace-view.tsx`
  - `src/features/dashboard/components/upload-card.tsx`
  - `src/features/documents/components/documents-view.tsx`
- **Behavior**: File upload rejections (e.g., size limits, MIME type violations, server timeouts) are caught gracefully.
- **User-Facing Fallback**: The UI banners and upload states are updated to read: `"Upload failed. Please check your file and try again."`

### 3. Document Deletions
- **Behavior**: Deleting a document invokes cascading deletions of vector embeddings and database chunks. If this complex transaction fails, a generic alert is shown.
- **User-Facing Fallback**: `"Failed to delete document. Please try again."`

### 4. Background Fetch Polling
- **Behavior**: The workspace dashboard polls for document processing statuses every 5 seconds. If the user briefly loses internet connection, the `fetch()` network error is suppressed gracefully.
- **Result**: The UI does not flicker or repeatedly display toast errors; it simply waits for the next polling interval to succeed.

## Benefits
- **Security**: Prevents internal architectural details (like Prisma table names or Qdrant connection strings) from bleeding into the client.
- **User Trust**: Provides a polished, stable, and professional aesthetic even when edge-case errors occur.
- **Developer Observability**: Since `console.error(err)` is preserved, engineers still retain 100% visibility into issues via the dev tools.
