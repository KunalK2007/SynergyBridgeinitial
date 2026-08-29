import { adminDb } from "../firebase/admin";
import { AIUsageLog } from "@/types/ai-usage";
import { v4 as uuidv4 } from "uuid";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  dailyLimit: number;
}

export async function checkRateLimit(studentId: string): Promise<boolean> {
  const windowSeconds = parseInt(process.env.AI_RATE_LIMIT_WINDOW || "600", 10);
  const maxRequests = parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS || "10", 10);
  const dailyLimit = parseInt(process.env.AI_DAILY_LIMIT || "100", 10);
  
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);
  const dayStart = now - (24 * 60 * 60 * 1000);

  // In MVP we just query Firestore
  const usageRef = adminDb.collection("aiUsage");
  
  try {
    // Check window limit
    const windowSnap = await usageRef
      .where("studentId", "==", studentId)
      .where("timestamp", ">=", windowStart)
      .get();
      
    if (windowSnap.size >= maxRequests) {
      return false; // Limit exceeded
    }

    // Check daily limit
    const dailySnap = await usageRef
      .where("studentId", "==", studentId)
      .where("timestamp", ">=", dayStart)
      .get();
      
    if (dailySnap.size >= dailyLimit) {
      return false; // Limit exceeded
    }

    return true;
  } catch (error) {
    console.error("Rate limit check failed", error);
    // Fail safe: allow request if DB fails, or we could block it
    return true;
  }
}

export async function logAIUsage(
  studentId: string,
  projectId: string | null,
  provider: "gemini" | "mock" | "openai" | "anthropic",
  model: string,
  requestType: "CHAT" | "LEARNING_PATH" | "HEALTH_ANALYSIS",
  success: boolean,
  errorMessage?: string,
  inputTokens?: number,
  outputTokens?: number
) {
  try {
    const id = uuidv4();
    const log: AIUsageLog = {
      id,
      studentId,
      projectId,
      provider,
      model,
      requestType,
      success,
      timestamp: Date.now(),
      errorMessage,
      inputTokens,
      outputTokens
    };
    
    await adminDb.collection("aiUsage").doc(id).set(log);
  } catch (error) {
    console.error("Failed to log AI usage", error);
  }
}
