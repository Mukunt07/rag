import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getLLMProvider } from "@/services/ai/llm.factory";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { documentId, provider = "gemini", model = "gemini-1.5-flash" } = body;

    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        documentChunks: {
          orderBy: { chunkIndex: "asc" },
          take: 15
        }
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const context = document.documentChunks.map(c => c.content).join("\n\n");
    if (!context.trim()) {
      return NextResponse.json({ error: "Document has no extracted content to summarize" }, { status: 400 });
    }

    const systemPrompt = `You are an expert research assistant. Generate a high-quality, comprehensive, and well-structured summary of the document.
Your summary should include:
1. A brief executive summary (1 paragraph).
2. Key concepts and core arguments (bullet points).
3. Critical insights and takeaways.
Use clear, readable markdown formatting.`;

    const userPrompt = `Generate a summary for the document "${document.originalFilename}" using the following content:
---
${context}
---`;

    const llmProvider = getLLMProvider(provider);
    const summaryText = await llmProvider.generateText(userPrompt, model, systemPrompt);

    // Save Generation log in DB
    const generation = await prisma.aiGeneration.create({
      data: {
        workspaceId: document.workspaceId,
        documentId: document.id,
        prompt: userPrompt,
        output: { summary: summaryText } as any,
        generationType: "summary",
        model: model,
      }
    });

    // Save as Artifact
    const artifact = await prisma.savedArtifact.create({
      data: {
        generationId: generation.id,
        workspaceId: document.workspaceId,
        documentId: document.id,
        artifactType: "summary",
        title: `Summary of ${document.originalFilename}`,
        payload: { summary: summaryText } as any,
      }
    });

    return NextResponse.json({ summary: summaryText, artifactId: artifact.id });
  } catch (error: any) {
    console.error("Summary Generation API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
