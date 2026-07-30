import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProviderResolver } from "@/services/ai/provider.resolver";
import { AIProviderId } from "@/services/ai/models.registry";

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardsResponse {
  title: string;
  flashcards: Flashcard[];
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
    const { documentId, count = 10, provider = "gemini", model = "gemini-1.5-flash" } = body;

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
      return NextResponse.json({ error: "Document has no extracted content to generate flashcards from" }, { status: 400 });
    }

    const systemPrompt = `You are a study helper assistant. Generate a high-quality list of flashcards based on the provided document.
Each flashcard must contain a "front" (question, term, or concept) and a "back" (answer, definition, or concise explanation).
You must respond with valid JSON matching this schema:
{
  "title": "Flashcards Title based on document topic",
  "flashcards": [
    {
      "front": "Front of the card (question or concept)",
      "back": "Back of the card (concise answer or definition)"
    }
  ]
}`;

    const userPrompt = `Generate exactly ${count} educational flashcards based on the following document context:
---
${context}
---`;

    const { provider: aiProvider, config } = await ProviderResolver.resolve(session.user.id, provider as AIProviderId, model);
    const flashcardData = await aiProvider.generateJson<FlashcardsResponse>(userPrompt, { ...config, systemPrompt });

    // Save Generation log in DB
    const generation = await prisma.aiGeneration.create({
      data: {
        workspaceId: document.workspaceId,
        documentId: document.id,
        prompt: userPrompt,
        output: flashcardData as any,
        generationType: "flashcards",
        model: model,
      }
    });

    // Save as Artifact
    const artifact = await prisma.savedArtifact.create({
      data: {
        generationId: generation.id,
        workspaceId: document.workspaceId,
        documentId: document.id,
        artifactType: "flashcards",
        title: flashcardData.title || `Flashcards for ${document.originalFilename}`,
        payload: flashcardData as any,
      }
    });

    return NextResponse.json({ ...flashcardData, artifactId: artifact.id });
  } catch (error: any) {
    console.error("Flashcard Generation API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
