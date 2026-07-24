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
    }

    const document = await uploadService.handleUpload(file, session.user.id, targetWorkspaceId);

    // Normally we would trigger a background worker here (e.g., via a message queue) 
    // to process the document text extraction and embedding to keep the request fast.
    
    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error("Upload error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
