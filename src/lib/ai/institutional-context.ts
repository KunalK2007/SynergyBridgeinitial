import { AnalyticsEngine } from "@/lib/analytics/analytics-engine";
import { InstitutionAnalytics, AnalyticsTimeRange, MIN_ANALYTICS_COHORT_SIZE, MetricValue } from "@/types/analytics";
import { SanitizedInstitutionalContext } from "@/types/ai-institutional";
import { ANALYTICS_SCHEMA_VERSION } from "@/lib/utils/analytics";

/**
 * Strips PII, suppresses small cohorts, and removes sensitive raw IDs
 * ensuring the AI context is strictly aggregated and safe.
 */
export async function buildInstitutionalAIContext(
  institutionId: string,
  timeRange: AnalyticsTimeRange = "ALL_TIME"
): Promise<SanitizedInstitutionalContext> {
  // 1. Fetch deterministic Phase 4A analytics
  // Note: Assuming a getInstitutionAnalytics method exists or can be wrapped if signature differs.
  // The Phase 4A spec requires getInstitutionAnalytics to exist.
  const rawAnalytics: InstitutionAnalytics = await AnalyticsEngine.getInstitutionAnalytics(institutionId, true);

  // 2. Filter out insufficient data / metrics that didn't meet cohort thresholds
  const sanitizedMetrics: Record<string, unknown> = {};
  
  // We explicitly extract known safe aggregated fields.
  const safeFields: (keyof InstitutionAnalytics)[] = [
    "studentCount",
    "activeStudents",
    "profileCompletionRate",
    "matchReadyRate",
    "problemCount",
    "publishedProblemCount",
    "applicationCount",
    "acceptanceRate",
    "activeProjectCount",
    "completedProjectCount",
    "completionRate",
    "averageFitScore",
    "averageProjectProgress",
    "atRiskProjectCount",
    "stalledProjectCount",
    "mentorCount",
    "mentorUtilizationRate",
    "certificateCount",
    "originalityPassRate",
    "crossInstitutionProjectCount"
  ];

  for (const field of safeFields) {
    const metric = rawAnalytics[field] as MetricValue<number>;
    if (metric && metric.available && metric.value !== null) {
      sanitizedMetrics[field] = metric.value;
    } else {
      sanitizedMetrics[field] = "INSUFFICIENT_DATA";
    }
  }

  // Handle funding metrics separately to ensure they are aggregated correctly
  sanitizedMetrics.fundingRequested = rawAnalytics.fundingRequested?.value ?? "INSUFFICIENT_DATA";
  sanitizedMetrics.fundingApproved = rawAnalytics.fundingApproved?.value ?? "INSUFFICIENT_DATA";
  sanitizedMetrics.fundingDisbursed = rawAnalytics.fundingDisbursed?.value ?? "INSUFFICIENT_DATA";

  // Handle complex nested objects safely
  const outcomeFunnel = { ...rawAnalytics.outcomeFunnel };
  const safeOutcomeFunnel: Record<string, unknown> = {};
  for (const [key, metric] of Object.entries(outcomeFunnel)) {
    const m = metric as unknown as Record<string, unknown>;
    if (m && m.available && m.value !== null) {
      safeOutcomeFunnel[key] = m.value;
    }
  }

  const healthDistribution = { ...rawAnalytics.healthDistribution };
  const safeHealthDistribution: Record<string, unknown> = {};
  for (const [key, metric] of Object.entries(healthDistribution)) {
    const m = metric as unknown as Record<string, unknown>;
    if (m && m.available && m.value !== null) {
      safeHealthDistribution[key] = m.value;
    }
  }

  // 3. Ensure no student/mentor IDs leak in skills
  const topDemandedSkills = (rawAnalytics.topDemandedSkills || []).map(skill => ({
    skillName: skill.skillName,
    category: skill.category,
    demandCount: skill.demandCount,
    supplyCount: skill.supplyCount,
    shortage: skill.shortage,
    priority: skill.priority
  }));

  const topSkillGaps = (rawAnalytics.topSkillGaps || []).map(gap => ({
    skillName: gap.skillName,
    category: gap.category,
    missingCount: gap.missingCount,
    weakCount: gap.weakCount
  }));

  // Build limitations list based on missing data
  const limitations: string[] = [];
  if (Object.values(sanitizedMetrics).includes("INSUFFICIENT_DATA")) {
    limitations.push(`Some metrics were suppressed because they did not meet the minimum cohort size of ${MIN_ANALYTICS_COHORT_SIZE}.`);
  }

  // 4. Return sanitized payload
  return {
    schemaVersion: rawAnalytics.schemaVersion || ANALYTICS_SCHEMA_VERSION,
    scope: "INSTITUTION",
    timeRange,
    metrics: {
      ...sanitizedMetrics,
      outcomeFunnel: safeOutcomeFunnel,
      healthDistribution: safeHealthDistribution
    },
    trends: [
      { type: "DEMANDED_SKILLS", data: topDemandedSkills },
      { type: "SKILL_GAPS", data: topSkillGaps }
    ],
    insights: [], // deterministic insights could be injected here if Phase 4A generates them
    limitations,
    privacy: {
      minimumCohortSize: MIN_ANALYTICS_COHORT_SIZE,
      piiRemoved: true
    }
  };
}
