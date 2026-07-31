import { NextRequest, NextResponse } from "next/server";
import { ragService } from "@/services/ai/rag.service";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    // Verify workspace ownership
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true }
    });

    if (!workspace || workspace.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access to workspace" }, { status: 403 });
    }

    // Find the unique chat session for this user and workspace
    const chatSession = await prisma.chatSession.findUnique({
      where: {
        workspaceId_createdById: {
          workspaceId,
          createdById: session.user.id
        }
      },
      include: {
        messages: {
          orderBy: [
            { createdAt: "asc" },
            { id: "asc" }
          ]
        }
      }
    });

    if (!chatSession) {
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({
      messages: chatSession.messages.map((m: any) => ({
        role: m.role,
        content: m.content,
        sources: m.citations || undefined
      }))
    });
  } catch (error: any) {
    console.error("Chat GET error", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
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
    const { message, workspaceId, provider, model } = body;

    if (!message || !workspaceId) {
      return NextResponse.json({ error: "Missing message or workspaceId" }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true }
    });

    if (!workspace || workspace.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access to workspace" }, { status: 403 });
    }

    // Atomically find or create the unique chat session for this workspace and user
    const chatSession = await prisma.chatSession.upsert({
      where: {
        workspaceId_createdById: {
          workspaceId,
          createdById: session.user.id
        }
      },
      update: {},
      create: {
        workspaceId,
        createdById: session.user.id,
        title: "Workspace Conversation"
      }
    });

    // Call the RAG Service to get the answer and citations
    const result = await ragService.searchAndAnswer(message, workspaceId, session.user.id, { provider, model });

    // Save User Message
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "user",
        content: message,
      }
    });

    // Save Assistant Message
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "assistant",
        content: result.answer,
        citations: result.sources as any,
      }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Chat API error", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
