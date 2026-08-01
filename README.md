# Knowledge Hub (RAG Application)

Knowledge Hub is a fully-featured, secure, and production-ready **Retrieval-Augmented Generation (RAG)** web application built with **Next.js 16 (App Router)**, **Prisma**, **Cloudflare R2**, **PostgreSQL**, and **Qdrant Vector DB**. 

It supports multi-tenant workspaces, smart file parsing (PDF, Word, Excel, Images with OCR), semantic vector search, conversational AI memory, AI quiz/flashcard generation, and customizable LLM API keys.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Prisma ORM)
- **Vector Database**: Qdrant Vector Search
- **Authentication**: Better Auth (Cookie-based session management)
- **File Storage**: Cloudflare R2 (S3-compatible API)
- **AI Models Supported**: Google Gemini (including `gemini-3.5-flash`), OpenAI (GPT-4o/Mini), Groq (Llama 3.3)

---

## 🚀 Production Deployment Checklist

Before deploying, ensure you configure the following **Environment Variables** in your production hosting platform:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"

# Better Auth Configuration
BETTER_AUTH_SECRET="your-secure-random-auth-secret-key"
BETTER_AUTH_URL="https://your-domain.com"

# Storage Configuration (Cloudflare R2 / AWS S3)
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="your-bucket-name"
R2_ENDPOINT="https://<account_id>.r2.cloudflarestorage.com"
NEXT_PUBLIC_FILE_URL_PREFIX="https://pub-<id>.r2.dev"

# Vector Database (Qdrant Cloud / Self-Hosted)
QDRANT_URL="https://your-qdrant-instance.aws.cloud.qdrant.io:6333"
QDRANT_API_KEY="your-qdrant-api-key"

# Client Key Encryption Secret
API_KEY_ENCRYPTION_KEY="your-secure-32-character-encryption-key"
```

---

## 💾 Deployment Steps

### 1. Database Migrations
Run the Prisma migrations against your production database:
```bash
npx prisma generate
npx prisma migrate deploy
```

### 2. Build the Application
Compile the Next.js production build:
```bash
npm run build
```

### 3. Start the Server
Start the Next.js application server:
```bash
npm run start
```

---

## ⚠️ Important Production Advisory

### Next.js Serverless Execution Timeouts
Currently, document uploading and vector indexing are handled in-process inside the `/api/documents/upload` route handler:
```typescript
await processingService.processDocument(document.id, processingJob.id);
```
If you deploy this application to **Vercel** or another serverless hosting provider, serverless function execution timeouts (typically 10s to 60s) might trigger when users upload large files.

* **For VPS Deployments (Render, Fly.io, AWS EC2/ECS)**: No changes are required. The process will run smoothly inside standard Node/Docker contexts.
* **For Serverless Deployments (Vercel)**: It is highly recommended to decouple `processingService.processDocument` and run it via a background task scheduler (such as **Inngest**, **Upstash QStash**, or a dedicated queue worker).
