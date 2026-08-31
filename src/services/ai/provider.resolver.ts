import { prisma } from "@/lib/prisma";
import { encryptionService } from "../security/encryption.service";
import { AIProvider, ProviderConfig } from "./ai.provider";
import { geminiProvider } from "./gemini.service";
import { openAIProvider } from "./openai.service";
import { groqProvider } from "./groq.service";
import { getModelConfig, AIProviderId } from "./models.registry";

export class ProviderResolver {
  static async resolveFromRaw(requestedProvider: AIProviderId, rawApiKey: string, requestedModel?: string): Promise<{ provider: AIProvider, config: ProviderConfig }> {
    let model = requestedModel;
    if (!model) {
        if (requestedProvider === "gemini") model = "gemini-3.5-flash";
        else if (requestedProvider === "openai") model = "gpt-4o-mini";
        else if (requestedProvider === "groq") model = "llama-3.3-70b-versatile";
        else model = "default";
    }

    const config: ProviderConfig = {
      apiKey: rawApiKey,
      model: model,
    };

    let providerInstance: AIProvider;
    switch (requestedProvider) {
      case "gemini":
        providerInstance = geminiProvider;
        break;
      case "openai":
        providerInstance = openAIProvider;
        break;
      case "groq":
        providerInstance = groqProvider;
        break;
      default:
        throw new Error(`Unsupported AI provider: ${requestedProvider}`);
    }

    return { provider: providerInstance, config };
  }

  /**
   * Resolves the AI Provider for a specific user and model/provider choice.
   * Fetches the user's encrypted key from DB, decrypts it, and returns the stateless provider and config.
   */
  static async resolve(userId: string, requestedProvider: AIProviderId, requestedModel?: string): Promise<{ provider: AIProvider, config: ProviderConfig }> {
    
    // Find the user's API key for this provider
    const apiKeyRecord = await prisma.userApiKey.findFirst({
      where: { userId, provider: requestedProvider },
      orderBy: { isDefault: "desc" } // Prioritize default key if they have multiple
    });

    if (!apiKeyRecord) {
      throw new Error(`No API key configured for provider: ${requestedProvider}`);
    }

    const decryptedKey = encryptionService.decrypt(apiKeyRecord.encryptedKey);

    return this.resolveFromRaw(requestedProvider, decryptedKey, requestedModel || apiKeyRecord.defaultModel || undefined);
  }
}
