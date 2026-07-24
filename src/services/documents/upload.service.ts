import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { storageService } from "../storage.service";
import { DocumentType, DocumentSource, StorageProvider, DocumentStatus, ProcessingStage } from "@prisma/client";

export class UploadService {
  async handleUpload(
    file: File,
    userId: string,
    workspaceId: string
  ) {
    const originalFilename = file.name;
    const fileSize = file.size;
    const mimeType = file.type;
    
    // Determine DocumentType
    let documentType: DocumentType = DocumentType.TXT;
    if (originalFilename.endsWith(".pdf")) documentType = DocumentType.PDF;
    else if (originalFilename.endsWith(".docx")) documentType = DocumentType.DOCX;
    else if (originalFilename.endsWith(".md")) documentType = DocumentType.MARKDOWN;

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudflare R2
    const storageKey = `workspaces/${workspaceId}/${uuidv4()}-${originalFilename}`;
    await storageService.uploadFile(storageKey, buffer, mimeType);

    // Create DB Record
    const document = await prisma.document.create({
      data: {
        title: originalFilename,
        originalFilename,
        documentType,
        source: DocumentSource.UPLOAD,
        storageProvider: StorageProvider.CLOUDFLARE_R2,
        storageKey,
        mimeType,
        fileSize,
        status: DocumentStatus.QUEUED,
        workspaceId,
        uploadedById: userId,
      }
    });

    // Create initial processing job
    await prisma.processingJob.create({
      data: {
        documentId: document.id,
        stage: ProcessingStage.QUEUED,
      }
    });

    return document;
  }
}

export const uploadService = new UploadService();
