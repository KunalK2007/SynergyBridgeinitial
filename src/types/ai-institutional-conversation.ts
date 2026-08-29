export interface InstitutionalAIMessage {
  id: string;
  role: "user" | "ai";
  content: string; // The natural language question or response text
  timestamp: string;
  analysisType?: string;
  groundingStatus?: string;
  confidence?: string;
  limitations?: string[];
  // Note: Raw analytics context is deliberately NOT stored here to prevent unauthorized exposure
}

export interface InstitutionalAIConversation {
  id: string;
  institutionId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  title: string;
}
