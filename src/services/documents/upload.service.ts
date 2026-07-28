import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { storageService } from "../storage.service";
import { validationService } from "./validation.service";
import { hashService } from "./hash.service";
import { optimizationService } from "./optimization.service";
import { DocumentSource, StorageProvider, DocumentStatus, ProcessingStage } from "@prisma/client";

export class UploadService {
  async handleUpload(
    file: File,
    userId: string,
    workspaceId: string
  ) {
    const originalFilename = file.name;
    const originalSize = file.size;
    const providedMimeType = file.type;
    
    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);

    // 1. Validation Service (Magic bytes & MIME mapping)
    const { documentType, mimeType } = await validationService.validateFile(rawBuffer, originalFilename, providedMimeType);

    // 2. Hash Service (SHA-256)
    const checksum = hashService.generateHash(rawBuffer);

    // 3. Duplicate Detection
    const existingDoc = await prisma.document.findFirst({
      where: {
        workspaceId,
        checksum,
      }
    });

    if (existingDoc) {
      throw new Error(`Duplicate file detected: A file with this exact content already exists as '${existingDoc.originalFilename}'.`);
    }

    // 4. Optimization Service
    const { buffer: optimizedBuffer, encoding } = await optimizationService.optimize(rawBuffer, documentType, originalFilename);
    const storageSize = optimizedBuffer.length;
    const compressionRatio = originalSize > 0 ? ((originalSize - storageSize) / originalSize) * 100 : 0;

    // 5. Upload to Cloudflare R2
    const storageKey = `workspaces/${workspaceId}/${uuidv4()}-${originalFilename}`;
    await storageService.uploadFile(storageKey, optimizedBuffer, mimeType, encoding);

    // 6. Create DB Record
    const document = await prisma.document.create({
      data: {
        title: originalFilename,
        originalFilename,
        documentType,
        source: DocumentSource.UPLOAD,
        storageProvider: StorageProvider.CLOUDFLARE_R2,
        storageKey,
        mimeType,
        originalSize,
        storageSize,
        compressionRatio,
        checksum,
        status: DocumentStatus.QUEUED,
        workspaceId,
        uploadedById: userId,
      }
    });

    // 7. Create initial processing job
    const processingJob = await prisma.processingJob.create({
      data: {
        documentId: document.id,
        stage: (ProcessingStage as any).QUEUED,
      } as any
    });

    return { document, processingJob };
  }
}

export const uploadService = new UploadService();
