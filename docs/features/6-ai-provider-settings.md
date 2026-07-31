# Feature: AI Provider Settings

## Overview
Because AI API calls cost money, this platform operates on a "Bring Your Own Key" (BYOK) model. Users must configure their own Google Gemini or OpenAI API keys in the settings menu to generate embeddings and chat responses.

## Tech Stack & Tools
- **Encryption**: Built-in Node.js `crypto` module (AES-256-GCM)
- **Database**: Neon DB (Serverless PostgreSQL via Prisma model: `UserApiKey`)
- **SDKs**: `@google/generative-ai`, `openai`

## Implementation Details
1. **Security & Encryption**: 
   API Keys are highly sensitive. When a user saves an API key via the UI, the `POST /api/settings/providers` endpoint encrypts the key using a secure, server-side-only `API_KEY_ENCRYPTION_KEY` environment variable. The raw key is never stored in plaintext in the database.
2. **Provider Resolution**:
   Throughout the app (e.g. `RagService`, `EmbeddingService`), we call the `ProviderResolver.resolve(userId, providerId)` method. This class queries the encrypted database record, decrypts it in memory, and dynamically instantiates the correct SDK client (Gemini or OpenAI) to handle the request.
3. **Live Validation**:
   Before saving an API key to the database, a lightweight validation endpoint ping tests the provider's API. If the key is revoked or invalid, the UI rejects the save operation to prevent downstream pipeline crashes.

## API Endpoints
- **POST `/api/settings/providers/test`**: Performs a live, un-saved ping to Google or OpenAI to verify key validity.
- **POST `/api/settings/providers`**: Encrypts and saves the validated key into the database, marking it as the default if requested.
- **GET `/api/settings/providers`**: Returns the list of configured providers (with the actual API key string masked, e.g., `sk-••••••3b2a`).
- **DELETE `/api/settings/providers/[id]`**: Removes the configured API key.

## UI Connection
- **Components**: `src/features/settings/components/provider-card.tsx`
- **Workflow**:
  - The UI presents input fields for API keys alongside a provider dropdown.
  - An interactive `Eye / EyeOff` button allows users to securely view or mask their pasted key before submitting.
  - Upon submission, a live loading state indicates testing. If successful, the card switches to an "Active" state.
