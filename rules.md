# KnowledgeHub AI Development Rules

## Project Overview

KnowledgeHub AI is a production-ready AI Knowledge Workspace built using Next.js, TypeScript, Supabase, Qdrant, and Google Gemini.

The primary goal of this project is to create clean, scalable, maintainable, and beginner-friendly code while following modern software engineering practices.

Every contribution must prioritize readability over cleverness.

---

# Core Principles

The AI agent must always:

- Write clean code.
- Write readable code.
- Write modular code.
- Keep functions small.
- Avoid duplicate code.
- Prefer composition over large components.
- Use descriptive names.
- Keep files organized.
- Follow SOLID principles where applicable.
- Prefer maintainability over shortcuts.

---

# Code Style

Always use:

- TypeScript
- Functional Components
- ES Modules
- Async/Await
- Named exports whenever possible

Avoid:

- any
- deeply nested callbacks
- overly complex logic
- duplicated code
- giant components
- magic numbers
- unnecessary abstractions

---

# Project Structure

Always follow this folder structure.

```
app/

components/

features/

services/

lib/

hooks/

types/

public/

docs/
```

Never create random folders.

If a new folder is needed,
explain why before creating it.

---

# Component Rules

Each component should have one responsibility.

Bad

Dashboard component

- upload
- chat
- notes
- quizzes
- settings
- navigation

Good

Dashboard

↓

UploadCard

↓

WorkspaceCard

↓

RecentDocuments

↓

QuickActions

↓

StatisticsCard

---

# File Size Rules

Maximum recommended file sizes.

Component

300 lines

Service

250 lines

Utility

150 lines

API Route

200 lines

Types

Unlimited

If a file exceeds the limit,
recommend refactoring.

---

# Function Rules

Every function should do exactly one job.

Bad

processDocument()

uploads

extracts

chunks

embeds

stores

logs

returns response

Good

uploadDocument()

extractText()

chunkDocument()

generateEmbeddings()

storeVectors()

---

# Naming Rules

Variables

camelCase

Functions

camelCase

Components

PascalCase

Types

PascalCase

Interfaces

PascalCase

Enums

PascalCase

Constants

UPPER_SNAKE_CASE

Files

kebab-case

Folders

lowercase

---

# Import Rules

Always group imports.

1.

React / Next.js

2.

Third-party libraries

3.

Internal components

4.

Hooks

5.

Services

6.

Types

7.

Utilities

Example

import ...

import ...

import ...

---

# Comment Rules

Only write comments when they add value.

Do NOT comment obvious code.

Bad

// increment i

i++

Good

// Retry if embedding API temporarily fails

---

# Error Handling

Never ignore errors.

Always

try/catch

Return meaningful messages.

Log unexpected failures.

Never expose secrets.

---

# Logging

Use structured logging.

Bad

console.log(data)

Good

console.error("Embedding generation failed", error)

Remove debug logs before production.

---

# TypeScript Rules

Never use

any

Use

interfaces

types

generics

Return types

strict typing

---

# API Rules

Every API route should

Validate input

Authenticate user

Handle errors

Return typed responses

Never trust client input.

---

# Database Rules

All database access belongs inside

/services

Never write SQL directly inside UI components.

---

# Business Logic

Business logic must never exist inside UI components.

UI

↓

Service

↓

Database

Correct

Button

↓

Service

↓

Supabase

Wrong

Button

↓

Supabase Query

---

# AI Rules

All AI prompts belong inside

/services/ai

Never hardcode prompts inside components.

Prompts should be reusable.

---

# RAG Rules

Always

Retrieve

↓

Build Context

↓

Call Gemini

↓

Return Citation

Never send the whole document.

---

# Security Rules

Never expose

API Keys

Secrets

Tokens

Passwords

Always use environment variables.

---

# Performance Rules

Avoid unnecessary rerenders.

Lazy load large components.

Memoize expensive calculations.

Reuse services.

---

# Accessibility

Every button

has labels

Every image

has alt text

Keyboard navigation must work.

Use semantic HTML.

---

# UI Rules

Use shadcn/ui.

Use Tailwind.

Avoid inline styles.

Maintain consistent spacing.

Prefer reusable UI components.

---

# State Management

Use:

React Context

for global state.

Use local state whenever possible.

Do not introduce Redux.

---

# Folder Responsibilities

app/

Routing only

components/

Reusable UI

features/

Feature-specific UI

services/

Business logic

hooks/

Reusable hooks

types/

Shared types

lib/

Configuration

docs/

Documentation

---

# Before Creating New Code

Ask:

Can this be reused?

Can this be simplified?

Can this be split?

Can this become a shared component?

---

# Before Editing Existing Code

Read the entire file.

Understand the flow.

Avoid unnecessary rewrites.

Preserve existing functionality.

---

# Refactoring Rules

When refactoring:

Keep behavior identical.

Improve readability.

Reduce duplication.

Split large functions.

Improve naming.

Never change unrelated code.

---

# Debugging Rules

When fixing bugs:

1.

Find the root cause.

2.

Explain the issue.

3.

Explain the fix.

4.

Implement the smallest safe change.

5.

Verify affected features.

Never patch symptoms.

---

# Documentation Rules

Every service should include:

Purpose

Inputs

Outputs

Dependencies

Side Effects

Complex workflows should be documented.

---

# Git Commit Style

Use Conventional Commits.

Examples

feat:

fix:

refactor:

docs:

style:

test:

build:

---

# Development Philosophy

Always optimize for:

Readability

Maintainability

Scalability

Reusability

Consistency

Developer Experience

The project should be understandable by beginners while remaining production-ready for experienced developers.

Every line of code should have a clear purpose.

If a simpler solution exists that maintains quality, always prefer the simpler solution.