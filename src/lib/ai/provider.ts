import { AIRequest, AIResponse } from "./types";

export interface AIProvider {
  name: string;
  generateResponse(request: AIRequest): Promise<AIResponse>;
}
