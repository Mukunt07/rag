import test from "node:test";
import assert from "node:assert";
import proxyquire from "proxyquire";
import { DocumentStatus, ProcessingStatus } from "@prisma/client";

test("Document Processing Background Updates", async (t) => {
  await t.test("updates job status to COMPLETED on success", async () => {
    const dbUpdates: any[] = [];
    
    const mockPrisma = {
      document: {
        findUnique: async () => ({ id: "doc-1", uploadedById: "user-1", documentType: "PDF" }),
        update: async (args: any) => dbUpdates.push({ model: "document", args })
      },
      processingJob: {
        update: async (args: any) => dbUpdates.push({ model: "processingJob", args })
      },
      userApiKey: {
        findFirst: async () => null
      },
      documentChunk: {
        createMany: async () => {}
      }
    };

    const mockStorage = { downloadDocument: async () => Buffer.from("mock") };
    const mockParser = { getParser: () => ({ parse: async () => ({ metadata: {} }) }) };
    const mockMetadata = { extractMetadata: async (doc: any) => doc };
    const mockChunking = { chunkDocument: async () => [{ content: "chunk1", metadata: { chunkIndex: 0 } }] };
    const mockEmbedding = { embedChunks: async () => [{ content: "chunk1", metadata: { chunkIndex: 0 }, vector: [0.1] }] };
    const mockQdrant = { indexChunks: async () => ["vec-1"] };

    const { ProcessingService } = proxyquire("../services/processing/processing.service", {
      "@/lib/prisma": { prisma: mockPrisma },
      "@/services/storage.service": { storageService: mockStorage },
      "./parser-factory.service": { parserFactory: mockParser },
      "./metadata.service": { metadataService: mockMetadata },
      "./chunking.service": { chunkingService: mockChunking },
      "./embedding.service": { embeddingService: mockEmbedding },
      "./qdrant.service": { qdrantService: mockQdrant }
    });

    const service = new ProcessingService();
    await service.processDocument("doc-1", "job-1");

    // Verify successful updates
    const finalJobUpdate = dbUpdates.filter(u => u.model === "processingJob").pop();
    assert.strictEqual(finalJobUpdate.args.data.status, ProcessingStatus.COMPLETED);
    
    const finalDocUpdate = dbUpdates.filter(u => u.model === "document").pop();
    assert.strictEqual(finalDocUpdate.args.data.status, DocumentStatus.READY);
  });
  
  await t.test("updates job status to FAILED on error", async () => {
    const dbUpdates: any[] = [];
    
    const mockPrisma = {
      document: {
        findUnique: async () => ({ id: "doc-error", uploadedById: "user-1", documentType: "PDF" }),
        update: async (args: any) => dbUpdates.push({ model: "document", args })
      },
      processingJob: {
        update: async (args: any) => dbUpdates.push({ model: "processingJob", args })
      }
    };

    // Force an error in storage
    const mockStorage = { 
      downloadDocument: async () => { throw new Error("Storage failure"); } 
    };

    const { ProcessingService } = proxyquire("../services/processing/processing.service", {
      "@/lib/prisma": { prisma: mockPrisma },
      "@/services/storage.service": { storageService: mockStorage },
    });

    const service = new ProcessingService();
    await service.processDocument("doc-error", "job-error");

    // Verify failure updates
    const finalJobUpdate = dbUpdates.filter(u => u.model === "processingJob").pop();
    assert.strictEqual(finalJobUpdate.args.data.status, ProcessingStatus.FAILED);
    assert.strictEqual(finalJobUpdate.args.data.errorMessage, "Storage failure");
    
    const finalDocUpdate = dbUpdates.filter(u => u.model === "document").pop();
    assert.strictEqual(finalDocUpdate.args.data.status, DocumentStatus.FAILED);
  });
});
