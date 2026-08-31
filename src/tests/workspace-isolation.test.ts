import test from "node:test";
import assert from "node:assert";
import proxyquire from "proxyquire";

test("Workspace Isolation in RAG Retrieval", async (t) => {
  await t.test("verify Qdrant filter cannot contain Workspace B's document IDs", async () => {
    // Mock the dependencies for RagService
    const mockPrisma = {
      document: {
        findMany: async ({ where }: any) => {
          // If query is for Workspace A, only return Workspace A docs
          if (where.workspaceId === "workspace-A") {
            return [{ id: "doc-A1" }, { id: "doc-A2" }];
          }
          return [];
        }
      },
      userApiKey: {
        findFirst: async () => ({ provider: "openai" })
      }
    };

    let capturedFilter: any = null;

    const mockQdrantClient = class {
      async search(_collectionName: string, queryObj: any) {
        capturedFilter = queryObj.filter;
        return [];
      }
    };

    const mockProviderResolver = {
      resolve: async () => ({
        provider: {
          generateText: async () => "Mock answer",
          generateEmbeddings: async () => [[0.1, 0.2, 0.3]]
        },
        config: { model: "mock-model" }
      })
    };

    // Use proxyquire to inject mocks into rag.service
    const { RagService } = proxyquire("../services/ai/rag.service", {
      "@qdrant/js-client-rest": { QdrantClient: mockQdrantClient },
      "@/lib/prisma": { prisma: mockPrisma },
      "./provider.resolver": { ProviderResolver: mockProviderResolver }
    });

    const service = new RagService();
    
    // User A searches their own Workspace A
    await service.searchAndAnswer("hello", "workspace-A", "user-A", { provider: "openai" });

    // Assert that the filter ONLY contains doc IDs from Workspace A
    assert.ok(capturedFilter, "A filter must be passed to Qdrant");
    assert.ok(capturedFilter.must, "Filter must use 'must' clause");
    
    const docIdFilter = capturedFilter.must.find((m: any) => m.key === "documentId");
    assert.ok(docIdFilter, "Filter must restrict by documentId");
    
    assert.deepStrictEqual(docIdFilter.match.any, ["doc-A1", "doc-A2"], "Filter must only contain Workspace A's document IDs");
    assert.ok(!docIdFilter.match.any.includes("doc-B1"), "Filter MUST NOT contain document IDs from Workspace B");
  });
});
