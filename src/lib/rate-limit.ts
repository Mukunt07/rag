import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 10 requests per 1 minute
// Note: Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env variables
let rateLimiter: Ratelimit | null = null;

try {
  // Only initialize if Redis variables exist, otherwise fallback gracefully 
  // (useful for local dev without redis set up yet)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    rateLimiter = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      // Optional: Prefix for the keys in redis
      prefix: "@upstash/ratelimit",
    });
  }
} catch (error) {
  console.warn("Failed to initialize Upstash Ratelimit. Redis connection issue.");
}

export async function checkRateLimit(userId: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  if (!rateLimiter) {
    // If not configured, allow request (prevents breaking the app entirely if redis is down)
    return { success: true, limit: 10, remaining: 10, reset: 0 };
  }
  
  return await rateLimiter.limit(userId);
}
