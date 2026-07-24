import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storageService } from "@/services/storage.service";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    // Find document
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // In a real app, verify user owns this workspace here.
    // For now we assume default-workspace

    // Generate signed URL
    const signedUrl = await storageService.getSignedDownloadUrl(document.storageKey);

    // Redirect user to the signed URL so browser can preview/download it
    return NextResponse.redirect(signedUrl);
  } catch (error: any) {
    console.error("Error generating signed url:", error);
    return NextResponse.json({ 
      error: "Failed to generate download url", 
      details: error?.message || String(error)
    }, { status: 500 });
  }
}
