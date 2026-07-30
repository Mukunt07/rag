import { prisma } from "@/lib/prisma";
import { storageService } from "@/services/storage.service";
import { parserFactory } from "./parser-factory.service";
import { metadataService } from "./metadata.service";
import { chunkingService } from "./chunking.service";
import { embeddingService } from "./embedding.service";
import { qdrantService } from "./qdrant.service";
import { DocumentStatus, ProcessingStage, ProcessingStatus } from "@prisma/client";

export class ProcessingService {
  /**
   * Processes a single document from start to finish.
   * This is intended to be called by a background worker.
   */
  async processDocument(documentId: string, jobId: string) {
    let currentStage: any = (ProcessingStage as any).QUEUED;
    
    try {
      const doc = await prisma.document.findUnique({ where: { id: documentId } });
      if (!doc) throw new Error("Document not found");

      // 1. DOWNLOADING
      currentStage = (ProcessingStage as any).DOWNLOADING;
      await this.updateJobStatus(jobId, currentStage, 10);
      
      const buffer = await storageService.downloadDocument(doc.storageKey);
      
      // 2. PARSING
      currentStage = (ProcessingStage as any).PARSING;
      await this.updateJobStatus(jobId, currentStage, 30);
      
      const parser = parserFactory.getParser(doc.documentType);
      let parsedDoc = await parser.parse(buffer, doc.originalFilename);
      
      // 3. EXTRACTING METADATA
      currentStage = (ProcessingStage as any).EXTRACTING;
      await this.updateJobStatus(jobId, currentStage, 50);
      
      parsedDoc = await metadataService.extractMetadata(parsedDoc);
      
      // Update Document with new metadata
      await prisma.document.update({
        where: { id: documentId },
        data: {
          wordCount: parsedDoc.metadata.wordCount,
          characterCount: parsedDoc.metadata.characterCount,
          pageCount: parsedDoc.metadata.pageCount,
          hasImages: parsedDoc.metadata.hasImages,
          hasTables: parsedDoc.metadata.hasTables,
          language: parsedDoc.metadata.language,
        }
      });

      // 4. CHUNKING
      currentStage = (ProcessingStage as any).CHUNKING;
      await this.updateJobStatus(jobId, currentStage, 70);
      
      const chunks = await chunkingService.chunkDocument(parsedDoc);
      
      // 5. EMBEDDING
      currentStage = (ProcessingStage as any).EMBEDDING;
      await this.updateJobStatus(jobId, currentStage, 80);
      
      const embeddedChunks = await embeddingService.embedChunks(doc.uploadedById, chunks);
      
      // 6. INDEXING
      currentStage = (ProcessingStage as any).INDEXING;
      await this.updateJobStatus(jobId, currentStage, 90);
      
      await qdrantService.indexChunks(doc, embeddedChunks);
      
      // Also save chunks to DB for reference if needed
      await prisma.documentChunk.createMany({
        data: embeddedChunks.map(c => ({
          documentId,
          chunkIndex: c.metadata.chunkIndex,
          content: c.content,
          tokenCount: 0, // Calculate properly if needed
          vectorId: c.metadata.chunkIndex.toString(), // Assuming Qdrant ID map or just index
          embeddingModel: "gemini", 
          pageNumber: c.metadata.pageNumber
        }))
      });

      // 7. COMPLETED
      currentStage = (ProcessingStage as any).COMPLETED;
      await this.updateJobStatus(jobId, currentStage, 100, ProcessingStatus.COMPLETED);
      
      await prisma.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.READY }
      });

    } catch (error: any) {
      console.error(`Processing failed at stage ${currentStage} for doc ${documentId}:`, error);
      
      await prisma.processingJob.update({
        where: { id: jobId },
        data: {
          status: ProcessingStatus.FAILED,
          errorMessage: error.message,
          failedStage: currentStage,
          lastError: error.stack,
          completedAt: new Date()
        } as any
      });
      
      await prisma.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.FAILED }
      });
    }
  }

  private async updateJobStatus(
    jobId: string, 
    stage: any, 
    progress: number,
    status: ProcessingStatus = ProcessingStatus.RUNNING
  ) {
    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        stage,
        progress,
        status,
        ...(status === ProcessingStatus.COMPLETED ? { completedAt: new Date() } : {})
      } as any
    });
  }
}

export const processingService = new ProcessingService();

