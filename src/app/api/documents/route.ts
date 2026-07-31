import { NextRequest, NextResponse } from "next/server";
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

    let targetWorkspaceId = workspaceId;

    if (!targetWorkspaceId || targetWorkspaceId === "default-workspace") {
      const userWorkspaces = await prisma.workspace.findMany({
        where: { ownerId: session.user.id },
        take: 1
      });

      if (userWorkspaces.length > 0) {
        targetWorkspaceId = userWorkspaces[0].id;
      } else {
        return NextResponse.json({ documents: [] }); // No workspaces, no documents
      }
    } else {
      const workspace = await prisma.workspace.findUnique({
        where: { id: targetWorkspaceId },
        select: { ownerId: true }
      });
      if (!workspace || workspace.ownerId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized access to workspace" }, { status: 403 });
      }
    }

    // Fetch documents along with their latest processing job status
    const documents = await prisma.document.findMany({
      where: {
        workspaceId: targetWorkspaceId,
        deletedAt: null
      },
      include: {
        processingJobs: {
          orderBy: { startedAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Failed to fetch documents", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
