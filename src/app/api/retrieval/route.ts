import { NextResponse } from "next/server";
import { retrievalService } from "@/services/retrieval/retrieval.service";
import { SearchOptions } from "@/services/retrieval/retrieval.types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, options } = body as { query: string; options?: SearchOptions };

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const response = await retrievalService.search(query, options);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to perform retrieval search", details: error.message },
      { status: 500 }
    );
  }
}
