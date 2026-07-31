import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProviderResolver } from "@/services/ai/provider.resolver";
import { AIProviderId } from "@/services/ai/models.registry";

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

interface QuizResponse {
  title: string;
  questions: QuizQuestion[];
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { documentId, questionCount = 5, provider = "gemini", model = "gemini-3.5-flash" } = body;

    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }

    // 1. Fetch document metadata & content chunks
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        documentChunks: {
          orderBy: { chunkIndex: "asc" },
          take: 15 // Limit context size to avoid exceeding LLM tokens
        }
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const context = document.documentChunks.map(c => c.content).join("\n\n");
    if (!context.trim()) {
      return NextResponse.json({ error: "Document has no extracted content to generate quiz from" }, { status: 400 });
    }

    // 2. Query LLM using the getLLMProvider factory
    const systemPrompt = `You are a helpful education assistant. Generate a high-quality quiz based on the provided document text. 
You must respond with valid JSON matching this schema:
{
  "title": "Quiz Title based on document topic",
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "Detailed explanation of why the correct option is correct."
    }
  ]
}`;

    const userPrompt = `Generate exactly ${questionCount} multiple-choice questions based on the following document context:
---
${context}
---`;

    const { provider: aiProvider, config } = await ProviderResolver.resolve(session.user.id, provider as AIProviderId, model);
    const quizData = await aiProvider.generateJson<QuizResponse>(userPrompt, { ...config, systemPrompt });

    // Save Generation log in DB
    await prisma.aiGeneration.create({
      data: {
        workspaceId: document.workspaceId,
        documentId: document.id,
        prompt: userPrompt,
        output: quizData as any,
        generationType: "quiz",
        model: model,
      }
    });

    return NextResponse.json(quizData);
  } catch (error: any) {
    console.error("Quiz Generation API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
