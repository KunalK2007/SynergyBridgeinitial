import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production", "mock"]).default("development"),
  // Firebase Server
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  
  // AI Provider
  AI_PROVIDER: z.enum(["mock", "gemini", "openai"]).default("mock"),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("gemini-1.5-flash"),
  AI_RATE_LIMIT_WINDOW: z.coerce.number().default(600),
  AI_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(10),
  AI_DAILY_LIMIT: z.coerce.number().default(100),
  
  // Explicit MOCK override flags to avoid accidents in production
  ENABLE_MOCK_INTEGRATIONS: z.coerce.boolean().default(false)
});

let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error("❌ Invalid server environment variables:");
  if (error instanceof z.ZodError) {
    console.error(error.flatten().fieldErrors);
  }
  throw new Error("Invalid environment variables");
}

// Production safety guard
if (env.NODE_ENV === "production") {
  if (!env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.warn("⚠️ WARNING: FIREBASE_SERVICE_ACCOUNT_KEY is missing in production.");
  }
  if (env.AI_PROVIDER === "mock" && !env.ENABLE_MOCK_INTEGRATIONS) {
    throw new Error("❌ CRITICAL: AI_PROVIDER is set to 'mock' in production without ENABLE_MOCK_INTEGRATIONS=true.");
  }
  if (env.AI_PROVIDER !== "mock" && !env.AI_API_KEY) {
    throw new Error(`❌ CRITICAL: AI_API_KEY is missing in production for provider ${env.AI_PROVIDER}.`);
  }
}

export const serverEnv = env;
