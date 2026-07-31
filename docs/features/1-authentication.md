# Feature: Multi-Tenant User Authentication

## Overview
This feature handles secure user registration, login, and session management. It ensures that only authenticated users can access the application and that their data (workspaces, documents, chats) remains strictly isolated.

## Tech Stack & Tools
- **Framework:** Next.js 16 (App Router)
- **Auth Provider:** Better Auth (`better-auth`)
- **Database:** Neon PostgreSQL
- **ORM:** Prisma Client
- **UI Components:** React, Tailwind CSS, Lucide Icons

## Implementation Details
1. **Core Configuration**: 
   The authentication is configured using `better-auth`. The configuration logic handles JWT token issuance, session tracking, and password-based login strategies.
2. **Database Integration**:
   Prisma models (`User`, `Session`, `Account`, `Verification`) map directly to PostgreSQL tables. When a user signs up, a `User` record is created, and when they log in, a `Session` record is minted.
3. **Route Protection**:
   We use Next.js Middleware (`src/middleware.ts`) to intercept incoming HTTP requests. If a user tries to access a protected route (like `/dashboard` or `/workspace`) without a valid session cookie, they are instantly redirected to `/login`.

## API Endpoints
- **POST `/api/auth/sign-in`** (Handled by Better Auth internally)
- **POST `/api/auth/sign-up`** (Handled by Better Auth internally)
- **POST `/api/auth/sign-out`** (Handled by Better Auth internally)
- **GET `/api/auth/session`**: Validates and retrieves the current user session context.

## UI Connection
- **Components**: `src/features/auth/components/login-form.tsx`, `signup-form.tsx`
- **Workflow**:
  - The UI presents simple email/password forms.
  - On submit, the forms invoke the `better-auth` client SDK methods (e.g., `signIn.email()`).
  - Upon success, the client SDK automatically sets the HTTP-only auth cookies in the browser.
  - The user is then redirected to `/dashboard` via Next.js `useRouter`.
