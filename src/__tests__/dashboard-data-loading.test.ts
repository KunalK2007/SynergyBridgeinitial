/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalyticsEngine } from "@/lib/analytics/analytics-engine";
import { UserRole } from "@/types/auth";
import { ProjectStatus } from "@/types/project";
import { ApplicationStatus } from "@/types/application";

// Mock Firebase Admin
vi.mock("@/lib/firebase/admin", () => {
  const mockCollections: Record<string, any> = {
    institutions: {
      doc: () => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ id: "synergybridge-demo-institute", name: "SynergyBridge Demo Institute" })
        })
      }),
      get: vi.fn().mockResolvedValue({
        size: 1,
        docs: [{ id: "synergybridge-demo-institute", data: () => ({ name: "SynergyBridge Demo Institute" }) }]
      })
    },
    users: {
      doc: (id: string) => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ uid: id, email: "student.demo@synergybridge.local", role: UserRole.STUDENT })
        })
      }),
      get: vi.fn().mockResolvedValue({
        size: 7,
        docs: [
          { data: () => ({ uid: "student_1", role: UserRole.STUDENT }) },
          { data: () => ({ uid: "student_2", role: UserRole.STUDENT }) },
          { data: () => ({ uid: "mentor_1", role: UserRole.MENTOR }) },
          { data: () => ({ uid: "admin_1", role: UserRole.ADMIN }) }
        ]
      })
    },
    studentProfiles: {
      doc: () => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            userId: "student_1",
            institutionId: "synergybridge-demo-institute",
            skills: [{ skillId: "sk_python", level: "ADVANCED" }]
          })
        })
      }),
      where: () => ({
        get: vi.fn().mockResolvedValue({ size: 2, docs: [] })
      })
    },
    gamificationProfiles: {
      doc: () => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            userId: "student_1",
            xp: 3250,
            level: 4,
            currentStreak: 7,
            totalAchievements: 6,
            badges: ["FIRST_PROJECT", "AI_INNOVATOR"]
          })
        })
      })
    },
    applications: {
      where: (field: string, op: string, val: string) => ({
        get: vi.fn().mockResolvedValue({
          size: 2,
          docs: [
            {
              id: "app_1",
              data: () => ({
                id: "app_1",
                problemId: "prob_1",
                applicantId: val,
                status: ApplicationStatus.ACCEPTED,
                synergyBridgeFitScore: 92
              })
            }
          ]
        })
      }),
      get: vi.fn().mockResolvedValue({
        size: 4,
        docs: [
          { id: "app_1", data: () => ({ id: "app_1", status: ApplicationStatus.ACCEPTED }) }
        ]
      })
    },
    projects: {
      where: (field: string, op: string, val: any) => ({
        get: vi.fn().mockResolvedValue({
          size: 2,
          docs: [
            {
              id: "demo_proj_1",
              data: () => ({
                id: "demo_proj_1",
                title: "CropGuard AI",
                status: ProjectStatus.IN_PROGRESS,
                progress: 65,
                studentIds: ["student_1", "student_2"],
                mentorId: "mentor_1"
              })
            }
          ]
        })
      }),
      get: vi.fn().mockResolvedValue({
        size: 2,
        docs: [
          {
            id: "demo_proj_1",
            data: () => ({
              id: "demo_proj_1",
              title: "CropGuard AI",
              status: ProjectStatus.IN_PROGRESS,
              progress: 65,
              studentIds: ["student_1"]
            })
          },
          {
            id: "demo_proj_2",
            data: () => ({
              id: "demo_proj_2",
              title: "Smart Water Grid",
              status: ProjectStatus.COMPLETED,
              progress: 100,
              studentIds: ["student_1"]
            })
          }
        ]
      })
    },
    problems: {
      get: vi.fn().mockResolvedValue({
        size: 8,
        docs: [
          { id: "prob_1", data: () => ({ id: "prob_1", title: "Crop Disease AI" }) }
        ]
      })
    },
    certificates: {
      where: () => ({
        get: vi.fn().mockResolvedValue({
          size: 1,
          docs: [{ id: "cert_1", data: () => ({ id: "cert_1", verificationId: "SB-2026-CERT-01" }) }]
        })
      }),
      get: vi.fn().mockResolvedValue({
        size: 1,
        docs: [{ id: "cert_1", data: () => ({ id: "cert_1", verificationId: "SB-2026-CERT-01" }) }]
      })
    },
    fundingGrants: {
      get: vi.fn().mockResolvedValue({
        size: 1,
        docs: [
          {
            id: "grant_1",
            data: () => ({
              id: "grant_1",
              projectId: "demo_proj_1",
              requestedAmount: 50000,
              approvedAmount: 40000,
              disbursedAmount: 20000,
              status: "APPROVED"
            })
          }
        ]
      })
    }
  };

  return {
    adminDb: {
      collection: (name: string) => mockCollections[name] || {
        doc: () => ({ get: vi.fn().mockResolvedValue({ exists: false }) }),
        get: vi.fn().mockResolvedValue({ size: 0, docs: [] }),
        where: () => ({ get: vi.fn().mockResolvedValue({ size: 0, docs: [] }) })
      }
    },
    adminAuth: {
      getUserByEmail: vi.fn().mockImplementation((email: string) => Promise.resolve({ uid: `uid_${email.split("@")[0]}` }))
    }
  };
});

describe("Dashboard Data Loading & Aggregation Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getStudentAnalytics correctly aggregates applicantId queries and gamification XP", async () => {
    const analytics = await AnalyticsEngine.getStudentAnalytics("student_1");

    expect(analytics.userId).toBe("student_1");
    expect(analytics.projectsActive.value).toBe(1);
    expect(analytics.applicationsAccepted.value).toBe(1);
    expect(analytics.xpEarned.value).toBe(3250);
    expect(analytics.currentStreak.value).toBe(7);
    expect(analytics.highestFitScore.value).toBe(92);
  });

  it("getPlatformAnalytics aggregates platform-wide metrics accurately", async () => {
    const platform = await AnalyticsEngine.getPlatformAnalytics();

    expect(platform.institutionCount.value).toBeGreaterThanOrEqual(1);
    expect(platform.problemCount.value).toBe(8);
    expect(platform.projectCount.value).toBe(2);
    expect(platform.completedProjectCount.value).toBe(1);
    expect(platform.fundingApproved.value).toBe(40000);
    expect(platform.fundingDisbursed.value).toBe(20000);
    expect(platform.certificateCount.value).toBe(1);
  });

  it("getMentorAnalytics computes capacity and assigned project health", async () => {
    const mentorStats = await AnalyticsEngine.getMentorAnalytics("mentor_1");

    expect(mentorStats.mentorId).toBe("mentor_1");
    expect(mentorStats.activeProjects.value).toBe(1);
    expect(mentorStats.capacityStatus).toBe("AVAILABLE");
  });

  it("project detail navigation URLs are formatted properly", () => {
    const projectId = "demo_proj_1";
    const detailUrl = `/dashboard/projects/${projectId}`;
    expect(detailUrl).toBe("/dashboard/projects/demo_proj_1");
  });
});
