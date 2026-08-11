import { OriginalityReport } from "@/types/originality";
import { Project } from "@/types/project";
import { v4 as uuidv4 } from "uuid";

export interface OriginalityAssessmentInput {
  projectId: string;
  projectMetadata: {
    descriptionLength: number;
    tasksCount: number;
    milestonesCount: number;
    hasRepositoryUrl: boolean;
  };
  peerReviewSignals: {
    reviewsConsidered: number;
    originalityConcerns: number;
  };
  existingVersion?: number;
  assessorId: string;
}

/**
 * Deterministic MVP originality assessment.
 * This is NOT a production plagiarism detector.
 * It is labeled SynergyBridge Originality Assessment — MVP.
 */
export function calculateOriginalityScore(
  input: OriginalityAssessmentInput
): OriginalityReport {
  let score = 0;
  const flags: string[] = [];

  // Deterministic scoring baseline based on metadata
  if (input.projectMetadata.descriptionLength > 500) score += 20;
  else if (input.projectMetadata.descriptionLength > 200) score += 10;
  else flags.push("Short project description limits originality assessment.");

  if (input.projectMetadata.hasRepositoryUrl) score += 30;
  else flags.push("No repository URL provided.");

  if (input.projectMetadata.tasksCount > 10) score += 20;
  else if (input.projectMetadata.tasksCount > 5) score += 10;

  if (input.projectMetadata.milestonesCount >= 2) score += 10;

  // Peer review factors
  if (input.peerReviewSignals.reviewsConsidered > 0) {
    if (input.peerReviewSignals.originalityConcerns === 0) {
      score += 20;
    } else {
      score -= input.peerReviewSignals.originalityConcerns * 15;
      flags.push(`${input.peerReviewSignals.originalityConcerns} originality concerns raised in peer review.`);
    }
  }

  // Ensure bounds
  score = Math.max(0, Math.min(100, score));

  // Threshold defined in funding constants is 75
  const passed = score >= 75;

  return {
    id: uuidv4(),
    projectId: input.projectId,
    version: (input.existingVersion || 0) + 1,
    score,
    passed,
    flags,
    methodologyVersion: "SYNERGYBRIDGE-ORIGINALITY-MVP-v1",
    repositoryAnalysis: {
      filesAnalyzed: input.projectMetadata.hasRepositoryUrl ? 15 : 0,
      duplicateIndicators: 0,
      simulated: true, // Clearly mark as simulated
    },
    peerReviewSignals: input.peerReviewSignals,
    assessedBy: input.assessorId,
    assessedAt: new Date().toISOString(),
    status: "COMPLETED",
  };
}
