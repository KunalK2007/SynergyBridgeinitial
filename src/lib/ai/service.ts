import { AIProvider } from "./provider";
import { GeminiProvider } from "./providers/gemini";
import { MockProvider } from "./providers/mock";
import { AIRequest, AIResponse } from "./types";
import { validateAIResponse } from "./safety";

export class AIService {
  private provider: AIProvider;

  constructor() {
    const providerName = process.env.AI_PROVIDER || "mock";
    if (providerName === "gemini") {
      this.provider = new GeminiProvider();
    } else {
      this.provider = new MockProvider();
    }
  }

  get providerName() {
    return this.provider.name;
  }

  async generateMentorResponse(request: AIRequest): Promise<AIResponse> {
    try {
      const rawResponse = await this.provider.generateResponse(request);
      return validateAIResponse(rawResponse as unknown as Record<string, unknown>);
    } catch (err: unknown) {
      console.error("AI Service Error:", err);
      // Return a safe fallback instead of exposing raw errors
      return {
        answer: "I'm sorry, I am currently unavailable. Please try again later.",
        grounding: "INSUFFICIENT_CONTEXT",
        confidence: "LOW",
        referencedSkills: [],
        referencedTasks: [],
        referencedMilestones: [],
        recommendedActions: [],
        escalationRecommended: true
      };
    }
  }

  async generateInstitutionalResponse(request: AIRequest): Promise<unknown> {
    try {
      return await this.provider.generateResponse(request);
    } catch (err: unknown) {
      console.error("Institutional AI Service Error:", err);
      return null;
    }
  }
}

export const aiService = new AIService();
