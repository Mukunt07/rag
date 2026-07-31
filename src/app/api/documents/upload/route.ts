import { NextRequest, NextResponse } from "next/server";
import { uploadService } from "@/services/documents/upload.service";
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

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const workspaceId = formData.get("workspaceId") as string;

    let targetWorkspaceId = workspaceId;
    
    if (workspaceId === "default-workspace") {
      const userWorkspaces = await prisma.workspace.findMany({
        where: { ownerId: session.user.id },
        take: 1
      });
      
      if (userWorkspaces.length > 0) {
        targetWorkspaceId = userWorkspaces[0].id;
      } else {
        // Create a default workspace if the user has none
        const newWorkspace = await prisma.workspace.create({
          data: {
            name: "My Workspace",
            ownerId: session.user.id
          }
        });
        targetWorkspaceId = newWorkspace.id;
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

    const { document, processingJob } = await uploadService.handleUpload(file, session.user.id, targetWorkspaceId);

    // In development/local mode, we'll await this directly to prevent Node from suspending the context.
    const { processingService } = await import("@/services/processing/processing.service");
    await processingService.processDocument(document.id, processingJob.id);
    
    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error("Upload error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
