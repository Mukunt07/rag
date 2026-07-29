import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const workspaceId = searchParams.get("workspaceId");

    const whereClause: any = {
      workspace: {
        ownerId: session.user.id
      },
      deletedAt: null
    };

    if (type) {
      whereClause.artifactType = type;
    }
    
    if (workspaceId) {
      whereClause.workspaceId = workspaceId;
    }

    const artifacts = await prisma.savedArtifact.findMany({
      where: whereClause,
      include: {
        document: {
          select: { originalFilename: true, title: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ artifacts });
  } catch (error) {
    console.error("Failed to fetch saved artifacts", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing artifact id" }, { status: 400 });
    }

    // Verify ownership
    const artifact = await prisma.savedArtifact.findFirst({
      where: {
        id,
        workspace: { ownerId: session.user.id }
      }
    });

    if (!artifact) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }

    await prisma.savedArtifact.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete artifact", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
