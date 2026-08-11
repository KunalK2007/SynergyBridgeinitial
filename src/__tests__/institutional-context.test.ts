import { describe, it, expect, vi, beforeEach } from "vitest";
import { InstitutionAnalytics } from "@/types/analytics";
import { buildInstitutionalAIContext } from "@/lib/ai/institutional-context";
import { AnalyticsEngine } from "@/lib/analytics/analytics-engine";

vi.mock("@/lib/analytics/analytics-engine", () => ({
  AnalyticsEngine: {
    getInstitutionAnalytics: vi.fn()
  }
}));

describe("Institutional Context Builder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should strip PII and respect INSUFFICIENT_DATA logic", async () => {
    vi.mocked(AnalyticsEngine.getInstitutionAnalytics).mockResolvedValue({
      institutionId: "inst_1",
      studentCount: { value: 2, available: false, reason: "INSUFFICIENT_COHORT" },
      activeStudents: { value: null, available: false },
      completionRate: { value: 0.9, available: true },
      topDemandedSkills: [],
      topSkillGaps: [],
      outcomeFunnel: {},
      healthDistribution: {},
      schemaVersion: "4A.1",
      calculatedAt: "2026-08-11"
    } as unknown as InstitutionAnalytics);

    const context = await buildInstitutionalAIContext("inst_1");
    
    // Privacy checks
    expect((context as unknown as Record<string, unknown>).institutionId).toBeUndefined(); // Stripped
    expect(context.metrics.studentCount).toBe("INSUFFICIENT_DATA");
    expect(context.metrics.completionRate).toBe(0.9);
    expect(context.limitations.some(l => l.includes("suppressed"))).toBe(true);
  });
});
