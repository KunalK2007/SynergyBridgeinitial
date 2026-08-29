import { Problem } from '@/types/problem';

export interface QualityResult {
  score: number;
  missingAreas: string[];
  recommendations: string[];
}

export function calculateProblemQuality(problem: Partial<Problem>): QualityResult {
  let score = 0;
  const missingAreas: string[] = [];
  const recommendations: string[] = [];

  // Title (10 points)
  if (problem.title && problem.title.length >= 10) {
    score += 10;
  } else {
    missingAreas.push("title");
    recommendations.push("Provide a clear, descriptive title (at least 10 characters).");
  }

  // Description (15 points)
  if (problem.problemStatement && problem.problemStatement.length >= 50) {
    score += 15;
  } else {
    missingAreas.push("problemStatement");
    recommendations.push("Expand on the problem statement to give a thorough background.");
  }

  // Why it matters (10 points)
  if (problem.whyItMatters && problem.whyItMatters.length >= 20) {
    score += 10;
  } else {
    missingAreas.push("whyItMatters");
    recommendations.push("Explain the significance of the problem and why it needs solving.");
  }

  // Expected outcome (15 points)
  if (problem.expectedOutcome && problem.expectedOutcome.length >= 20) {
    score += 15;
  } else {
    missingAreas.push("expectedOutcome");
    recommendations.push("Describe the ideal solution and expected outcome.");
  }

  // Required skills (15 points)
  if (problem.skills && problem.skills.filter(s => s.requirementType === 'REQUIRED').length > 0) {
    score += 15;
  } else {
    missingAreas.push("requiredSkills");
    recommendations.push("List at least one REQUIRED skill to help teams understand the technical needs.");
  }

  // Constraints (10 points)
  if (problem.constraints && problem.constraints.length > 0) {
    score += 10;
  } else {
    missingAreas.push("constraints");
    recommendations.push("Add constraints (e.g. Budget, Time, Hardware) to frame the project boundaries.");
  }

  // Impact/beneficiaries (10 points)
  if (problem.targetBeneficiaries && problem.targetBeneficiaries.length > 0) {
    score += 10;
  } else {
    missingAreas.push("targetBeneficiaries");
    recommendations.push("Specify who will benefit from this solution (Target Beneficiaries).");
  }

  // SDGs (5 points)
  if (problem.sdgs && problem.sdgs.length > 0) {
    score += 5;
  } else {
    missingAreas.push("sdgs");
    recommendations.push("Tag relevant Sustainable Development Goals (SDGs) to highlight the social impact.");
  }

  // Timeline (5 points)
  if (problem.estimatedDurationWeeks || problem.deadline) {
    score += 5;
  } else {
    missingAreas.push("timeline");
    recommendations.push("Provide an estimated duration or a deadline for the project.");
  }

  // Success criteria (5 points)
  if (problem.successCriteria && problem.successCriteria.length > 0) {
    score += 5;
  } else {
    missingAreas.push("successCriteria");
    recommendations.push("Define measurable success criteria so teams know how their solution will be evaluated.");
  }

  return {
    score,
    missingAreas,
    recommendations
  };
}
