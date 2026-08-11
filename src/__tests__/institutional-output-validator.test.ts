import { describe, it, expect } from "vitest";
import { validateInstitutionalAIOutput, createSafeFallback } from "@/lib/ai/institutional-output-validator";
import { SanitizedInstitutionalContext } from "@/types/ai-institutional";

describe("Institutional Output Validator", () => {
  const mockContext: SanitizedInstitutionalContext = {
    schemaVersion: "4A.1",
    scope: "INSTITUTION",
    timeRange: "ALL_TIME",
    metrics: {
      studentCount: 100,
      completionRate: 0.85
    },
    trends: [],
    insights: [],
    limitations: ["Small cohort suppressed"],
    privacy: { minimumCohortSize: 5, piiRemoved: true }
  };

  it("should accept grounded valid responses", () => {
    const raw = {
      answer: "Performance is good.",
      insights: [
        { title: "Good Performance", explanation: "High completion", evidence: "85%", impact: "HIGH", priority: "MEDIUM", recommendedAction: "Keep it up" }
      ],
      confidence: "HIGH",
      groundingStatus: "GROUNDED"
    };

    const validated = validateInstitutionalAIOutput(raw, mockContext);
    expect(validated.groundingStatus).toBe("GROUNDED");
    expect(validated.limitations).toContain("Small cohort suppressed");
  });

  it("should downgrade HIGH confidence if metrics have INSUFFICIENT_DATA", () => {
    const contextWithInsufficient = {
      ...mockContext,
      metrics: { studentCount: "INSUFFICIENT_DATA" }
    };

    const raw = {
      answer: "Performance is good.",
      confidence: "HIGH",
      groundingStatus: "GROUNDED"
    };

    const validated = validateInstitutionalAIOutput(raw, contextWithInsufficient as unknown as SanitizedInstitutionalContext);
    expect(validated.groundingStatus).toBe("PARTIALLY_GROUNDED"); // Downgraded
  });

  it("should return INSUFFICIENT_DATA fallback on malformed response", () => {
    const validated = validateInstitutionalAIOutput("Just a string", mockContext);
    expect(validated.groundingStatus).toBe("INSUFFICIENT_DATA");
  });

  it("should return INSUFFICIENT_DATA fallback if groundingStatus explicitly says so", () => {
    const raw = { answer: "Idk", groundingStatus: "INSUFFICIENT_DATA" };
    const validated = validateInstitutionalAIOutput(raw, mockContext);
    expect(validated.groundingStatus).toBe("INSUFFICIENT_DATA");
  });
});
