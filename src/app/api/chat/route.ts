import { NextRequest, NextResponse } from "next/server";
import { ragService } from "@/services/ai/rag.service";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message, workspaceId, sessionId, provider, model } = body;

    if (!message || !workspaceId) {
      return NextResponse.json({ error: "Missing message or workspaceId" }, { status: 400 });
    }

    // Call the RAG Service to get the answer and citations
    const result = await ragService.searchAndAnswer(message, workspaceId, session.user.id, { provider, model });

    // Save the message and the bot's response if sessionId is provided
    if (sessionId) {
      // Save User Message
      await prisma.chatMessage.create({
        data: {
          sessionId,
          role: "user",
          content: message,
        }
      });

      // Save Assistant Message
      await prisma.chatMessage.create({
        data: {
          sessionId,
          role: "assistant",
          content: result.answer,
          citations: result.sources,
        }
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Chat API error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
