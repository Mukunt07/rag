import OpenAI from "openai";
import { AIProvider, ProviderConfig, ProviderError, ProviderErrorCode } from "./ai.provider";

export class OpenAIProvider implements AIProvider {
  private normalizeError(error: any): never {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new ProviderError("INVALID_API_KEY", "Your API key is invalid or unauthorized. Please check your API key.");
      }
      if (error.status === 429) {
        throw new ProviderError("PROVIDER_LIMIT_REACHED", "Your API request was limited by the provider. Please check your API key usage, quota, or billing status.");
      }
      if (error.status === 404 || error.status === 400 && error.message.includes("model")) {
        throw new ProviderError("MODEL_UNAVAILABLE", "The specified model is unavailable.");
      }
      if (error.status && error.status >= 500) {
        throw new ProviderError("PROVIDER_UNAVAILABLE", "The AI provider is temporarily unavailable. Please try again later.");
      }
    }
    
    if (error.name === "APITimeoutError" || error.code === "ETIMEDOUT") {
      throw new ProviderError("PROVIDER_TIMEOUT", "The request to the AI provider timed out.");
    }

    throw new ProviderError("UNKNOWN_ERROR", error.message || "An unknown error occurred with the AI provider.");
  }

  async validateApiKey(config: ProviderConfig): Promise<boolean> {
    try {
      const openai = new OpenAI({ apiKey: config.apiKey, maxRetries: 0 });
      await openai.models.list();
      return true;
    } catch (error) {
      this.normalizeError(error);
    }
  }

  async generateEmbeddings(texts: string[], config: ProviderConfig): Promise<number[][]> {
    try {
      const openai = new OpenAI({ apiKey: config.apiKey });
      const modelName = config.model || "text-embedding-3-small";
      
      const response = await openai.embeddings.create({
        model: modelName,
        input: texts,
      });

      return response.data.map(d => d.embedding);
    } catch (error) {
      this.normalizeError(error);
    }
  }

  async generateText(prompt: string, config: ProviderConfig): Promise<string> {
    try {
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
    } catch (error) {
      this.normalizeError(error);
    }
  }

  async generateJson<T>(prompt: string, config: ProviderConfig): Promise<T> {
    try {
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
    } catch (error) {
      this.normalizeError(error);
    }
  }
}

export const openAIProvider = new OpenAIProvider();
