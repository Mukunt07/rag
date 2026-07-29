import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QdrantClient } from "@qdrant/js-client-rest";

const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY,
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 1. Verify document exists and belongs to a workspace owned by the user (or just verify ownerId)
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        workspace: true
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.workspace.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch document chunks to get vectorIds stored in database
    const chunks = await prisma.documentChunk.findMany({
      where: { documentId: id },
      select: { vectorId: true }
    });
    const vectorIds = chunks.map(c => c.vectorId).filter(Boolean);

    // 2. Soft-delete document in PostgreSQL
    await prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    // 3. Delete corresponding vectors in Qdrant (Best Effort)
    if (vectorIds.length > 0) {
      try {
        await qdrantClient.delete("documents", {
          points: vectorIds
        });
      } catch (qdrantError) {
        console.error("Failed to delete vectors from Qdrant:", qdrantError);
        // We don't fail the request since database soft-delete succeeded
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
