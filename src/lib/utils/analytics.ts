import { MetricValue, OutcomeFunnel } from "@/types/analytics";

export const ANALYTICS_SCHEMA_VERSION = "4A.1";

export function createMetric<T>(
  value: T | null,
  reason?: MetricValue<T>["reason"],
  sourceDescription?: string
): MetricValue<T> {
  return {
    value,
    available: value !== null && value !== undefined && (typeof value === "number" ? !isNaN(value) && isFinite(value) : true),
    reason: value === null || value === undefined || (typeof value === "number" && (isNaN(value) || !isFinite(value))) ? reason || "NO_DATA" : undefined,
    calculatedAt: new Date().toISOString(), // In real pure functions, date shouldn't be here if strictly pure, but we'll accept it here for MVP or inject it later. Let's make it deterministic by not calling Date.now() if we can, but DTO expects it. Actually, prompt says: "not call Date.now() inside pure functions". I'll remove it from the pure function and set it in the engine.
    sourceDescription,
  };
}

export function createMetricPure<T>(
  value: T | null,
  reason?: MetricValue<T>["reason"],
  sourceDescription?: string
): Omit<MetricValue<T>, "calculatedAt"> {
  const isInvalidNum = typeof value === "number" && (isNaN(value) || !isFinite(value));
  const isNull = value === null || value === undefined;
  
  if (isNull || isInvalidNum) {
    return {
      value: null,
      available: false,
      reason: reason || "NO_DATA",
      sourceDescription,
    };
  }

  return {
    value,
    available: true,
    sourceDescription,
  };
}

export function calculateRate(numerator: number, denominator: number, sourceDescription?: string): Omit<MetricValue<number>, "calculatedAt"> {
  if (denominator === 0) {
    return createMetricPure<number>(null, "NO_DATA", sourceDescription);
  }
  return createMetricPure<number>((numerator / denominator) * 100, undefined, sourceDescription);
}

export function calculateAverage(values: number[], sourceDescription?: string): Omit<MetricValue<number>, "calculatedAt"> {
  if (!values || values.length === 0) {
    return createMetricPure<number>(null, "NO_DATA", sourceDescription);
  }
  const sum = values.reduce((a, b) => a + b, 0);
  return createMetricPure<number>(sum / values.length, undefined, sourceDescription);
}

export function calculateApplicationAcceptanceRate(accepted: number, submitted: number): Omit<MetricValue<number>, "calculatedAt"> {
  return calculateRate(accepted, submitted, "Accepted applications / Submitted applications");
}

export function calculateProjectCompletionRate(completed: number, started: number): Omit<MetricValue<number>, "calculatedAt"> {
  return calculateRate(completed, started, "Completed projects / Started projects");
}

export function calculateProfileCompletionRate(completed: number, total: number): Omit<MetricValue<number>, "calculatedAt"> {
  return calculateRate(completed, total, "Completed profiles / Total profiles");
}

export function calculateAverageFitScore(scores: number[]): Omit<MetricValue<number>, "calculatedAt"> {
  const validScores = scores.filter(s => s >= 0 && s <= 100 && !isNaN(s));
  return calculateAverage(validScores, "Sum of valid fit scores / count");
}

export function calculateMentorUtilization(activeProjects: number, maxActiveProjects: number): Omit<MetricValue<number>, "calculatedAt"> {
  return calculateRate(activeProjects, maxActiveProjects, "Active projects / Max active projects");
}

export function calculateOriginalityPassRate(passed: number, totalAssessed: number): Omit<MetricValue<number>, "calculatedAt"> {
  return calculateRate(passed, totalAssessed, "Originality passed / Total assessed");
}

export function calculateFundingApprovalRate(approved: number, requested: number): Omit<MetricValue<number>, "calculatedAt"> {
  return calculateRate(approved, requested, "Funding approved / Funding requested");
}

export function calculateFundingDisbursementRate(disbursed: number, approved: number): Omit<MetricValue<number>, "calculatedAt"> {
  return calculateRate(disbursed, approved, "Funding disbursed / Funding approved");
}

export function calculateMatchReadyRate(matchReady: number, total: number): Omit<MetricValue<number>, "calculatedAt"> {
  return calculateRate(matchReady, total, "Match-ready students / Total students");
}

// Ensure privacy suppression
export function applyPrivacySuppression<T>(metric: Omit<MetricValue<T>, "calculatedAt">, cohortSize: number, minCohortSize: number = 5): Omit<MetricValue<T>, "calculatedAt"> {
  if (cohortSize < minCohortSize) {
    return {
      value: null,
      available: false,
      reason: "INSUFFICIENT_COHORT",
      sourceDescription: metric.sourceDescription
    };
  }
  return metric;
}
