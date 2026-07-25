import { NextResponse } from "next/server";
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const step = searchParams.get("step") || "1";

  try {
    if (step === "1") {
      // Step 1: Test connection
      const collections = await client.getCollections();
      return NextResponse.json({ success: true, step, collections });
    } 
    
    if (step === "2") {
      // Step 2: Create Collection
      await client.createCollection("documents", {
        vectors: {
          size: 768, // Gemini text-embedding-004 is 768
          distance: "Cosine",
        },
      });
      return NextResponse.json({ success: true, step, message: "Collection 'documents' created." });
    }

    if (step === "3") {
      // Step 3 & 4: Insert and Search
      await client.upsert("documents", {
        wait: true,
        points: [
          {
            id: 1,
            vector: Array(768).fill(0.5),
            payload: {
              text: "Hello Qdrant",
              documentId: "test",
            },
          },
        ],
      });

      const result = await client.search("documents", {
        vector: Array(768).fill(0.5),
        limit: 3,
      });

      return NextResponse.json({ success: true, step, searchResult: result });
    }

    return NextResponse.json({ success: false, error: "Invalid step." });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, step, error: error.message || String(error) });
  }
}
