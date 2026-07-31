# Environment Setup & Deployment Guide

This guide describes how to configure and set up the RAG application's integrations.

---

## 1. Prerequisites
Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**

---

## 2. Environment Variables Configuration

Create a `.env.local` or `.env` file in the root directory. Paste the following configuration parameters:

```env
# Relational Database URL (Neon PostgreSQL or similar)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Better Auth Configuration
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_API_KEY="generate_a_random_api_key"

# Cloudflare R2 Credentials
R2_ACCOUNT_ID="your_cloudflare_account_id"
R2_ACCESS_KEY_ID="your_cloudflare_access_key_id"
R2_SECRET_ACCESS_KEY="your_cloudflare_secret_access_key"
R2_BUCKET_NAME="knowledgehub"
R2_ENDPOINT="https://your_cloudflare_account_id.r2.cloudflarestorage.com"

# Qdrant Vector DB Credentials
QDRANT_URL="https://your_qdrant_instance_url"
QDRANT_API_KEY="your_qdrant_api_key"

# Cryptography / Security Key (Must be a 32-byte hex string for AES-256 key encryption)
API_KEY_ENCRYPTION_KEY="ca9b7df49b204f4d302a445d77f812a4e9b7b9be463c84d30f1d76bb4a37cbc1"
```

---

## 3. Database Initialization

Run the following commands to initialize and sync your relational database schema:

```bash
# Generate the Prisma client
npx prisma generate

# Apply migrations / push the schema structure to Postgres
npx prisma db push
```

---

## 4. Launching the Application

Start the local development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application. Go to **Settings > Provider API Keys** to configure your OpenAI or Google Gemini API keys so you can begin uploading documents.
