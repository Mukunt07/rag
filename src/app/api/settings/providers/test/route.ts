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

  let provider: string | undefined;
  let rawApiKey: string | undefined;

  try {
    const body = await req.json();
    provider = body.provider;
    rawApiKey = body.apiKey;

    if (!provider || !rawApiKey) {
      return NextResponse.json({ error: "Provider and API Key are required" }, { status: 400 });
    }

    // Strip invisible/non-ASCII characters (e.g. accidental bullet points copied from terminal)
    const cleanApiKey = rawApiKey.replace(/[^\x20-\x7E]/g, '').trim();

    if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(cleanApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
      await model.generateContent("Hello, this is a test. Reply 'OK'.");
    } else if (provider === "openai") {
      const openai = new OpenAI({ apiKey: cleanApiKey });
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
    
    let details = error.message;
    if (provider === "gemini" && rawApiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${rawApiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        const modelNames = data.models?.map((m: any) => m.name).join(", ");
        details = `${error.message}. Available models: ${modelNames}`;
        console.log("Available Gemini models:", modelNames);
      } catch (e) {
        console.error("Failed to fetch models list:", e);
      }
    }

    return NextResponse.json({ error: "Invalid API Key or connection failed", details: details }, { status: 400 });
  }
}
