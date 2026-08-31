import { prisma } from "@/lib/prisma";

export interface UsageLogParams {
  userId: string;
  workspaceId: string;
  provider: string;
  model: string;
  requestType: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  cost?: number;
  documentId?: string;
  chatSessionId?: string;
  errorCategory?: string; // New parameter to encode errors
}

export class UsageService {
  /**
   * Logs provider usage metrics directly to the database.
   */
  static async logUsage(params: UsageLogParams) {
    try {
      // If there is an error, prefix it to the requestType to track failures without changing schema
      const finalRequestType = params.errorCategory 
        ? `FAILED:${params.errorCategory}:${params.requestType}` 
        : params.requestType;

      await prisma.usageMetric.create({
        data: {
          userId: params.userId,
          workspaceId: params.workspaceId,
          provider: params.provider,
          model: params.model,
          requestType: finalRequestType,
          inputTokens: params.inputTokens,
          outputTokens: params.outputTokens,
          totalTokens: params.inputTokens + params.outputTokens,
          latencyMs: params.latencyMs,
          cost: params.cost,
          documentId: params.documentId,
          chatSessionId: params.chatSessionId,
        }
      });
    } catch (error) {
      console.error("Failed to log provider usage:", error);
      // Fail silently to prevent interrupting the main user flow
    }
  }
}
