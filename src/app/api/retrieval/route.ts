import { NextResponse } from "next/server";
import { retrievalService } from "@/services/retrieval/retrieval.service";
import { SearchOptions } from "@/services/retrieval/retrieval.types";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { query, options } = body as { query: string; options?: SearchOptions };

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const response = await retrievalService.search(session.user.id, query, options);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to perform retrieval search", details: error.message },
      { status: 500 }
    );
  }
}
