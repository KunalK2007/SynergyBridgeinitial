import { AnalyticsTimeRange } from "./analytics";

export type InstitutionalAnalysisType =
  | "PERFORMANCE"
  | "SKILL_DEMAND"
  | "STUDENT_OUTCOMES"
  | "MENTOR_CAPACITY"
  | "INDUSTRY_COLLABORATION"
  | "PROJECT_HEALTH"
  | "STRATEGIC";

export type GroundingStatus =
  | "GROUNDED"
  | "PARTIALLY_GROUNDED"
  | "INSUFFICIENT_DATA"
  | "REFUSED";

export type AIInstitutionalConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface InstitutionalAIRequest {
  question: string;
  timeRange?: AnalyticsTimeRange;
  analysisType?: InstitutionalAnalysisType;
  conversationId?: string;
}

export interface InstitutionalInsight {
  title: string;
  explanation: string;
  evidence: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  priority: "HIGH" | "MEDIUM" | "LOW";
  recommendedAction: string;
}

export interface InstitutionalAIResponse {
  answer: string;
  insights: InstitutionalInsight[];
  supportingMetrics: string[];
  recommendations: string[];
  limitations: string[];
  confidence: AIInstitutionalConfidence;
  groundingStatus: GroundingStatus;
  generatedAt: string;
  analyticsSchemaVersion: string;
}

export interface SanitizedInstitutionalContext {
  schemaVersion: string;
  scope: string;
  timeRange: AnalyticsTimeRange;
  metrics: Record<string, unknown>; // Serialized safe metrics
  trends: Record<string, unknown>[]; // Serialized safe trends
  insights: Record<string, unknown>[];
  limitations: string[];
  privacy: {
    minimumCohortSize: number;
    piiRemoved: boolean;
  };
}
