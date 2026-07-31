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

    // Fetch document chunks to get vectorIds and embedding models stored in database
    const chunks = await prisma.documentChunk.findMany({
      where: { documentId: id },
      select: { vectorId: true, embeddingModel: true }
    });
    
    // Group vectors by embedding model
    const vectorsByModel = chunks.reduce((acc, chunk) => {
      if (chunk.vectorId && chunk.embeddingModel) {
        if (!acc[chunk.embeddingModel]) acc[chunk.embeddingModel] = [];
        acc[chunk.embeddingModel].push(chunk.vectorId);
      }
      return acc;
    }, {} as Record<string, string[]>);

    // 2. Soft-delete document in PostgreSQL
    await prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    // 3. Delete corresponding vectors in Qdrant (Best Effort)
    for (const [model, vectorIds] of Object.entries(vectorsByModel)) {
      if (vectorIds.length > 0) {
        try {
          const collectionName = `documents_${model.replace(/[^a-zA-Z0-9]/g, '_')}`;
          await qdrantClient.delete(collectionName, {
            points: vectorIds
          });
        } catch (qdrantError) {
          console.error(`Failed to delete vectors from Qdrant collection ${model}:`, qdrantError);
          // We don't fail the request since database soft-delete succeeded
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
