import { AIRequest, AIResponse } from "../types";

export class MockProvider {
  name = "mock";

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const prompt = request.userPrompt.toLowerCase();
    
    let answer = "[MOCK] I am an AI Mentor. ";
    let escalationRecommended = false;
    const grounding: "GROUNDED" | "PARTIALLY_GROUNDED" | "INSUFFICIENT_CONTEXT" = "GROUNDED";
    const referencedSkills: string[] = [];
    const referencedTasks: string[] = [];

    if (prompt.includes("help") && prompt.includes("blocked")) {
      answer += "It sounds like you're blocked. I recommend discussing this complex issue with your human mentor.";
      escalationRecommended = true;
    } else if (prompt.includes("gap") || prompt.includes("skill")) {
      answer += "Based on the context, you should focus on your required skills that are currently weak.";
      const lp = request.context?.learningPath as unknown[];
      if (lp && lp.length > 0) {
        const firstLp = lp[0] as { targetSkillId: string };
        referencedSkills.push(firstLp.targetSkillId);
        answer += ` Specifically, improve ${firstLp.targetSkillId}.`;
      }
    } else if (prompt.includes("next") || prompt.includes("task")) {
      answer += "You should work on your open tasks.";
      const tsks = request.context?.tasks as unknown[];
      if (tsks && tsks.length > 0) {
        const firstTask = tsks[0] as { id: string, title: string };
        referencedTasks.push(firstTask.id);
        answer += ` Maybe start with: ${firstTask.title}.`;
      }
    } else {
      answer += "That is a great question. Make sure you refer to your project guidelines.";
    }

    return {
      answer,
      grounding,
      confidence: "HIGH",
      referencedSkills,
      referencedTasks,
      referencedMilestones: [],
      recommendedActions: [],
      escalationRecommended,
      metadata: {
        model: "mock-v1",
        inputTokens: 150,
        outputTokens: 45
      }
    };
  }
}
