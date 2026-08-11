import { AIResponse } from "./types";

export function validateAIResponse(data: Record<string, unknown> | null): AIResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid AI response format");
  }

  const grounding = (data.grounding as string === "GROUNDED" || data.grounding as string === "PARTIALLY_GROUNDED")
    ? (data.grounding as "GROUNDED" | "PARTIALLY_GROUNDED")
    : "INSUFFICIENT_CONTEXT";

  const confidence = (data.confidence as string === "HIGH" || data.confidence as string === "MEDIUM")
    ? (data.confidence as "HIGH" | "MEDIUM")
    : "LOW";

  const sanitized: AIResponse = {
    answer: typeof data.answer === "string" ? data.answer : "I encountered an error generating an answer.",
    grounding: grounding,
    confidence: confidence,
    referencedSkills: Array.isArray(data.referencedSkills) ? data.referencedSkills : [],
    referencedTasks: Array.isArray(data.referencedTasks) ? data.referencedTasks : [],
    referencedMilestones: Array.isArray(data.referencedMilestones) ? data.referencedMilestones : [],
    recommendedActions: Array.isArray(data.recommendedActions) ? data.recommendedActions : [],
    escalationRecommended: !!data.escalationRecommended
  };

  return sanitized;
}
