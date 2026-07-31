export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) {
      throw error;
    }

    const errorMsg = error?.message?.toLowerCase() || "";
    const isTransientError = 
      errorMsg.includes("429") || 
      errorMsg.includes("503") || 
      errorMsg.includes("too many requests") || 
      errorMsg.includes("service unavailable") ||
      errorMsg.includes("fetch failed");

    if (!isTransientError) {
      throw error;
    }

    console.warn(`[Retry Wrapper] API call failed. Retrying in ${delayMs}ms... (${retries} attempts left). Error: ${errorMsg}`);
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    return withRetry(fn, retries - 1, delayMs * 2);
  }
}
