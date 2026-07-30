import OpenAI from "openai";
import { AIProvider, ProviderConfig } from "./ai.provider";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

export class OpenAIProvider implements AIProvider {
  async generateEmbeddings(texts: string[], config: ProviderConfig): Promise<number[][]> {
    const openai = new OpenAI({ apiKey: config.apiKey });
    const modelName = config.model || "text-embedding-3-small";
    
    const response = await openai.embeddings.create({
      model: modelName,
      input: texts,
    });

    return response.data.map(d => d.embedding);
  }

  async generateText(prompt: string, config: ProviderConfig): Promise<string> {
    const openai = new OpenAI({ apiKey: config.apiKey });
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (config.systemPrompt) {
      messages.push({ role: "system", content: config.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await openai.chat.completions.create({
      model: config.model,
      messages,
      temperature: config.temperature,
      top_p: config.topP,
      max_tokens: config.maxTokens,
    });

    return response.choices[0]?.message?.content || "";
  }

  async generateJson<T>(prompt: string, config: ProviderConfig): Promise<T> {
    const openai = new OpenAI({ apiKey: config.apiKey });
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (config.systemPrompt) {
      messages.push({ role: "system", content: config.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await openai.chat.completions.create({
      model: config.model,
      messages,
      temperature: config.temperature,
      top_p: config.topP,
      max_tokens: config.maxTokens,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content) as T;
  }
}

export const openAIProvider = new OpenAIProvider();
