import test from "node:test";
import assert from "node:assert";
import { ProviderError, ProviderErrorCode } from "../services/ai/ai.provider";
import { openAIProvider } from "../services/ai/openai.service";
import { geminiProvider } from "../services/ai/gemini.service";
import { groqProvider } from "../services/ai/groq.service";

// We use any to access private methods for testing
const mockOpenAI = openAIProvider as any;
const mockGemini = geminiProvider as any;
const mockGroq = groqProvider as any;

test("Provider Error Normalization", async (t) => {
  await t.test("OpenAI 401 maps to INVALID_API_KEY", () => {
    const error = {
      name: "APIError",
      status: 401,
      message: "Incorrect API key provided"
    };
    Object.setPrototypeOf(error, require("openai").OpenAI.APIError.prototype);
    
    try {
      mockOpenAI.normalizeError(error);
      assert.fail("Should have thrown");
    } catch (e: any) {
      assert.ok(e instanceof ProviderError);
      assert.strictEqual(e.code, "INVALID_API_KEY");
    }
  });

  await t.test("OpenAI 429 maps to PROVIDER_LIMIT_REACHED", () => {
    const error = {
      name: "APIError",
      status: 429,
      message: "Rate limit reached"
    };
    Object.setPrototypeOf(error, require("openai").OpenAI.APIError.prototype);
    
    try {
      mockOpenAI.normalizeError(error);
      assert.fail("Should have thrown");
    } catch (e: any) {
      assert.ok(e instanceof ProviderError);
      assert.strictEqual(e.code, "PROVIDER_LIMIT_REACHED");
    }
  });

  await t.test("Gemini 429 string maps to PROVIDER_LIMIT_REACHED", () => {
    const error = new Error("429 Too Many Requests, quota exceeded");
    
    try {
      mockGemini.normalizeError(error);
      assert.fail("Should have thrown");
    } catch (e: any) {
      assert.ok(e instanceof ProviderError);
      assert.strictEqual(e.code, "PROVIDER_LIMIT_REACHED");
    }
  });
  
  await t.test("Groq 404 maps to MODEL_UNAVAILABLE", () => {
    const error = {
      name: "APIError",
      status: 404,
      message: "Model not found"
    };
    Object.setPrototypeOf(error, require("openai").OpenAI.APIError.prototype);
    
    try {
      mockGroq.normalizeError(error);
      assert.fail("Should have thrown");
    } catch (e: any) {
      assert.ok(e instanceof ProviderError);
      assert.strictEqual(e.code, "MODEL_UNAVAILABLE");
    }
  });
});
