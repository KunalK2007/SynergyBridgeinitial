export interface OriginalityReport {
  id: string;
  projectId: string;

  version: number;
  score: number;
  passed: boolean;

  flags: string[];

  methodologyVersion: string;

  repositoryAnalysis?: {
    filesAnalyzed: number;
    duplicateIndicators: number;
    simulated: boolean;
  };

  peerReviewSignals?: {
    reviewsConsidered: number;
    originalityConcerns: number;
  };

  assessedBy: string;
  assessedAt: string;

  status: "PENDING" | "COMPLETED" | "FAILED";
}
