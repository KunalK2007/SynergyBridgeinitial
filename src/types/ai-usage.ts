export interface AIUsageLog {
  id: string;
  studentId: string;
  projectId: string | null;
  provider: "gemini" | "mock" | "openai" | "anthropic";
  model: string;
  requestType: "CHAT" | "LEARNING_PATH" | "HEALTH_ANALYSIS";
  inputTokens?: number;
  outputTokens?: number;
  timestamp: number;
  success: boolean;
  errorMessage?: string;
}
