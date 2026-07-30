import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { provider, apiKey } = body;

    if (!provider || !apiKey) {
      return NextResponse.json({ error: "Provider and API Key are required" }, { status: 400 });
    }

    if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      await model.generateContent("Hello, this is a test. Reply 'OK'.");
    } else if (provider === "openai") {
      const openai = new OpenAI({ apiKey });
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hello, this is a test. Reply 'OK'." }],
        max_tokens: 5,
      });
    } else {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Connection successful" });
  } catch (error: any) {
    console.error("API Key validation failed:", error);
    return NextResponse.json({ error: "Invalid API Key or connection failed", details: error.message }, { status: 400 });
  }
}
