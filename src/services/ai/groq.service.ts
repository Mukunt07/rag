import OpenAI from "openai";
import { AIProvider, ProviderConfig } from "./ai.provider";
import { withRetry } from "@/lib/retry";

export class GroqProvider implements AIProvider {
  async generateEmbeddings(texts: string[], config: ProviderConfig): Promise<number[][]> {
    throw new Error(
      "Groq does not support generating vector embeddings. Please configure Google Gemini or OpenAI for your workspace embeddings."
    );
  }

  async generateText(prompt: string, config: ProviderConfig): Promise<string> {
    const openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (config.systemPrompt) {
      messages.push({ role: "system", content: config.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await withRetry(() => 
      openai.chat.completions.create({
        model: config.model || "llama-3.3-70b-versatile",
        messages,
        temperature: config.temperature,
        top_p: config.topP,
        max_tokens: config.maxTokens,
      }),
      3,
      1000
    );

    return response.choices[0]?.message?.content || "";
  }

  async generateJson<T>(prompt: string, config: ProviderConfig): Promise<T> {
    const openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (config.systemPrompt) {
      messages.push({ role: "system", content: config.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await withRetry(() => 
      openai.chat.completions.create({
        model: config.model || "llama-3.3-70b-versatile",
        messages,
        temperature: config.temperature,
        top_p: config.topP,
        max_tokens: config.maxTokens,
        response_format: { type: "json_object" },
      }),
      3,
      1000
    );

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content) as T;
  }
}

export const groqProvider = new GroqProvider();
