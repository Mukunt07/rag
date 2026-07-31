# Knowledge Hub (RAG Application)

Knowledge Hub is a fully-featured, production-ready **Retrieval-Augmented Generation (RAG)** web application built with Next.js 16, Prisma, Cloudflare R2, Neon PostgreSQL, and Qdrant Vector DB. It supports multi-tenant workspaces, smart file parsing (PDF, Word, Excel, Images with OCR), semantic search, conversational memory, and customizable AI settings.

---

## 📚 Table of Contents
1. [Core Features & Functionalities](file:///c:/Users/ACER/Desktop/rag/docs/features.md)
2. [System Architecture & Data Flows](file:///c:/Users/ACER/Desktop/rag/docs/architecture.md)
3. [Environment Setup & Installation Guide](file:///c:/Users/ACER/Desktop/rag/docs/setup.md)

---

## 🚀 Quick Start

### 1. Setup Environment Variables
Create a `.env.local` file in the root folder with configuration details for Neon PostgreSQL, Cloudflare R2, and Qdrant. See the [Setup Guide](file:///c:/Users/ACER/Desktop/rag/docs/setup.md) for details.

### 2. Install Dependencies
```bash
npm install
```

### 3. Synchronize Database Schema
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
