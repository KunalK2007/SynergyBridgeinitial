import { describe, it, expect, vi } from "vitest";
import { aiService } from "@/lib/ai/service";
import { validateAIResponse } from "@/lib/ai/safety";

describe("AI Service & Safety", () => {
  it("validates safe responses correctly", () => {
    const rawResponse = {
      answer: "Good job",
      grounding: "GROUNDED",
      confidence: "HIGH",
      referencedSkills: ["React"],
      referencedTasks: [],
      referencedMilestones: [],
      recommendedActions: [],
      escalationRecommended: false
    };

    const validated = validateAIResponse(rawResponse);
    expect(validated.grounding).toBe("GROUNDED");
    expect(validated.confidence).toBe("HIGH");
  });

  it("sanitizes malformed responses safely", () => {
    const rawResponse = {
      answer: "I am hallucinating",
      grounding: "ABSOLUTE_TRUTH", // Invalid enum
      confidence: "SURE", // Invalid enum
    };

    const validated = validateAIResponse(rawResponse);
    // Should fallback to safe defaults
    expect(validated.grounding).toBe("INSUFFICIENT_CONTEXT");
    expect(validated.confidence).toBe("LOW");
    expect(validated.referencedSkills).toEqual([]);
    expect(validated.escalationRecommended).toBe(false);
  });
  
  it("uses mock provider by default when AI_PROVIDER is mock", async () => {
    // Process.env.AI_PROVIDER is set to 'mock' by default if undefined or if testing
    const req = {
      systemPrompt: "test",
      userPrompt: "help me I'm blocked",
      context: {}
    };

    const response = await aiService.generateMentorResponse(req);
    expect(response.answer).toContain("[MOCK]");
    expect(response.escalationRecommended).toBe(true);
  });
});
