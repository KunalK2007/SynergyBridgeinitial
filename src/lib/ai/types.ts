export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  history?: { role: "user" | "model"; content: string }[];
  context?: Record<string, unknown>;
}

export interface AIResponse {
  answer: string;
  grounding: "GROUNDED" | "PARTIALLY_GROUNDED" | "INSUFFICIENT_CONTEXT";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  referencedSkills: string[];
  referencedTasks: string[];
  referencedMilestones: string[];
  recommendedActions: string[];
  escalationRecommended: boolean;
  metadata?: {
    inputTokens?: number;
    outputTokens?: number;
    model?: string;
  };
}
