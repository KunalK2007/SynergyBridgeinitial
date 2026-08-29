import { InstitutionalAIResponse, SanitizedInstitutionalContext, GroundingStatus } from "@/types/ai-institutional";

/**
 * Validates the AI response to ensure it conforms to the expected structure
 * and does not contain obvious hallucinations or ungrounded claims.
 */
export function validateInstitutionalAIOutput(
  rawOutput: Record<string, unknown> | unknown,
  context: SanitizedInstitutionalContext
): InstitutionalAIResponse {
  // If the provider returned nothing or a string, it failed structured output
  if (!rawOutput || typeof rawOutput !== "object") {
    return createSafeFallback("AI response was malformed or missing.");
  }

  try {
    const rawObj = rawOutput as Record<string, unknown>;
    const answer = typeof rawObj.answer === "string" ? rawObj.answer : "No answer provided.";
    const confidence = ["HIGH", "MEDIUM", "LOW"].includes(rawObj.confidence as string) 
      ? (rawObj.confidence as "HIGH" | "MEDIUM" | "LOW") 
      : "LOW";
    
    // Check if the AI returned INSUFFICIENT_DATA
    if (rawObj.groundingStatus === "INSUFFICIENT_DATA") {
      return createSafeFallback("The available SynergyBridge analytics are insufficient to answer this question reliably.");
    }

    const insights = Array.isArray(rawObj.insights) ? rawObj.insights.map((i: Record<string, unknown>) => ({
      title: (i.title as string) || "Insight",
      explanation: (i.explanation as string) || "",
      evidence: (i.evidence as string) || "",
      impact: ["HIGH", "MEDIUM", "LOW"].includes(i.impact as string) ? (i.impact as "HIGH" | "MEDIUM" | "LOW") : "LOW",
      priority: ["HIGH", "MEDIUM", "LOW"].includes(i.priority as string) ? (i.priority as "HIGH" | "MEDIUM" | "LOW") : "LOW",
      recommendedAction: (i.recommendedAction as string) || ""
    })) : [];

    const supportingMetrics = Array.isArray(rawObj.supportingMetrics) ? (rawObj.supportingMetrics as string[]) : [];
    const recommendations = Array.isArray(rawObj.recommendations) ? (rawObj.recommendations as string[]) : [];
    
    // Add existing deterministic limitations from context to the response
    const limitations = Array.isArray(rawObj.limitations) ? (rawObj.limitations as string[]) : [];
    const mergedLimitations = Array.from(new Set([...limitations, ...context.limitations]));

    let groundingStatus: GroundingStatus = ["GROUNDED", "PARTIALLY_GROUNDED", "INSUFFICIENT_DATA", "REFUSED"].includes(rawObj.groundingStatus as string) 
      ? (rawObj.groundingStatus as GroundingStatus)
      : "PARTIALLY_GROUNDED";

    // Strict validation: if confidence is HIGH but metrics indicate INSUFFICIENT_DATA for key areas, downgrade it
    const hasInsufficientData = Object.values(context.metrics).some(v => v === "INSUFFICIENT_DATA");
    if (hasInsufficientData && confidence === "HIGH") {
      groundingStatus = "PARTIALLY_GROUNDED";
    }

    return {
      answer,
      insights,
      supportingMetrics,
      recommendations,
      limitations: mergedLimitations,
      confidence,
      groundingStatus,
      generatedAt: new Date().toISOString(),
      analyticsSchemaVersion: context.schemaVersion
    };

  } catch (err) {
    console.error("Failed to validate institutional AI output:", err);
    return createSafeFallback("An error occurred while validating the AI response.");
  }
}

export function createSafeFallback(reason: string): InstitutionalAIResponse {
  return {
    answer: "INSUFFICIENT_DATA",
    insights: [],
    supportingMetrics: [],
    recommendations: [],
    limitations: [reason],
    confidence: "LOW",
    groundingStatus: "INSUFFICIENT_DATA",
    generatedAt: new Date().toISOString(),
    analyticsSchemaVersion: "4A.1" // Fallback default
  };
}
