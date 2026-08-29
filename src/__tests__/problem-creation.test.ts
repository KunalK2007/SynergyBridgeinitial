/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { problemSchema, draftProblemSchema } from "@/lib/validation/problem";
import { 
  ProblemType, 
  DifficultyLevel, 
  GeographicScope, 
  TeamPreference, 
  RequirementType, 
  SkillImportance, 
  SkillLevel, 
  ProblemStatus, 
  VerificationStatus 
} from "@/types/problem";
import { UserRole } from "@/types/auth";
import { NextRequest } from "next/server";
import { sanitizeForFirestore } from "@/app/api/problems/route";

// Store mock database items
const mockProblemsDb: Record<string, any> = {
  mock_prob_123: {
    id: "mock_prob_123",
    posterId: "user_faculty_1",
    createdAt: 1000,
    title: "Test Problem",
    status: "PUBLISHED",
    updatedAt: 2000,
  },
  mock_student_draft_1: {
    id: "mock_student_draft_1",
    posterId: "user_student_1",
    createdAt: 1500,
    title: "Student Initial Draft",
    status: ProblemStatus.DRAFT,
    verificationStatus: VerificationStatus.UNVERIFIED,
    updatedAt: 1500,
  },
};

// Mock Firebase Admin
vi.mock("@/lib/firebase/admin", () => {
  const mockSet = vi.fn().mockImplementation((data: any) => {
    return Promise.resolve(data);
  });

  return {
    adminAuth: {
      verifyIdToken: vi.fn(async (token: string) => {
        if (token === "token_student") {
          return { uid: "user_student_1", email: "student.demo@synergybridge.local" };
        }
        if (token === "token_faculty") {
          return { uid: "user_faculty_1", email: "faculty.demo@synergybridge.local" };
        }
        if (token === "token_admin") {
          return { uid: "user_admin_1", email: "admin.demo@synergybridge.local" };
        }
        throw new Error("Invalid token");
      }),
    },
    adminDb: {
      settings: vi.fn(),
      collection: vi.fn((colName: string) => {
        if (colName === "users") {
          return {
            doc: vi.fn((uid: string) => ({
              get: vi.fn().mockResolvedValue({
                exists: true,
                data: () => {
                  if (uid === "user_student_1") {
                    return { role: UserRole.STUDENT, displayName: "Aarav Sharma", institutionId: "inst_1" };
                  }
                  if (uid === "user_faculty_1") {
                    return { role: UserRole.FACULTY, displayName: "Prof. Priya", institutionId: "inst_1" };
                  }
                  return { role: UserRole.ADMIN, displayName: "Admin User", institutionId: "inst_1" };
                },
              }),
            })),
          };
        }
        return {
          doc: vi.fn((id?: string) => {
            const docId = id || "mock_prob_new";
            return {
              id: docId,
              get: vi.fn().mockResolvedValue({
                exists: !!mockProblemsDb[docId],
                data: () => mockProblemsDb[docId] || {},
              }),
              set: mockSet,
            };
          }),
          where: vi.fn().mockReturnThis(),
          get: vi.fn().mockResolvedValue({
            docs: Object.values(mockProblemsDb).map((d) => ({
              id: d.id,
              data: () => d,
            })),
          }),
        };
      }),
    },
  };
});

describe("Problem Validation & Creation Workflow", () => {
  const validProblemData = {
    title: "AI Crop Disease Detection",
    shortDescription: "Detect leaf blights using computer vision mobile models.",
    problemStatement: "Farmers experience massive yield losses due to early disease misdiagnosis in rural agricultural areas.",
    whyItMatters: "Early intervention protects crop yields and increases farm food security across drought regions.",
    expectedOutcome: "A deployable low-latency mobile inference model that identifies at least 15 crop diseases accurately.",
    successCriteria: ["Model accuracy over 92%", "Inference time under 200ms"],
    domain: "Agriculture & Food Security",
    problemType: ProblemType.ACADEMIC,
    difficulty: DifficultyLevel.INTERMEDIATE,
    skills: [
      {
        skillId: "sk_python",
        name: "Python",
        category: "Software Development",
        requirementType: RequirementType.REQUIRED,
        importance: SkillImportance.REQUIRED,
        minimumLevel: SkillLevel.INTERMEDIATE,
      },
    ],
    tags: ["agriculture", "computer-vision"],
    sdgs: [2, 9],
    geographicScope: GeographicScope.STATE,
    constraints: [],
    teamPreference: TeamPreference.SMALL_TEAM,
    minTeamSize: 2,
    maxTeamSize: 5,
    estimatedDurationWeeks: 12,
    funding: { fundingEnabled: false },
  };

  it("successfully validates complete problem payload with problemSchema", () => {
    const result = problemSchema.safeParse(validProblemData);
    expect(result.success).toBe(true);
  });

  it("fails validation when required Basics fields are missing or too short", () => {
    const invalidData = {
      ...validProblemData,
      title: "Crop", // < 5 chars
      shortDescription: "Short", // < 10 chars
    };
    const result = problemSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.title).toBeDefined();
      expect(errors.shortDescription).toBeDefined();
    }
  });

  it("handles optional numeric inputs when left empty or undefined", () => {
    const dataWithEmptyNumbers = {
      ...validProblemData,
      minTeamSize: "",
      maxTeamSize: NaN,
      estimatedDurationWeeks: null,
    };
    const result = problemSchema.safeParse(dataWithEmptyNumbers);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minTeamSize).toBeUndefined();
      expect(result.data.maxTeamSize).toBeUndefined();
      expect(result.data.estimatedDurationWeeks).toBeUndefined();
    }
  });

  it("validates draft schema with partial fields", () => {
    const partialDraft = {
      title: "Incomplete Draft Title",
      domain: "Healthcare",
    };
    const result = draftProblemSchema.safeParse(partialDraft);
    expect(result.success).toBe(true);
  });

  it("sanitizes undefined fields to ensure Firestore compatibility", () => {
    const dataWithUndefined = {
      title: "Clean Problem",
      subDomain: undefined,
      nested: {
        amount: undefined,
        currency: "INR",
      },
      list: ["one", undefined, "three"],
    };

    const sanitized = sanitizeForFirestore(dataWithUndefined);
    expect(sanitized.title).toBe("Clean Problem");
    expect("subDomain" in sanitized).toBe(false);
    expect("amount" in (sanitized as any).nested).toBe(false);
    expect((sanitized as any).nested.currency).toBe("INR");
    expect((sanitized as any).list).toEqual(["one", "three"]);
  });

  describe("Authoritative API (/api/problems)", () => {
    let POST: (req: NextRequest) => Promise<Response>;
    let GET: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
      const mod = await import("@/app/api/problems/route");
      POST = mod.POST;
      GET = mod.GET;
    });

    it("rejects unauthenticated requests with 401", async () => {
      const req = new NextRequest("http://localhost/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PUBLISH", data: validProblemData }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("allows FACULTY to publish a problem directly to public repository", async () => {
      const req = new NextRequest("http://localhost/api/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token_faculty",
        },
        body: JSON.stringify({ action: "PUBLISH", data: validProblemData }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe(ProblemStatus.PUBLISHED);
      expect(json.problem.posterId).toBe("user_faculty_1");
      expect(json.problem.posterRole).toBe(UserRole.FACULTY);
      expect(json.problem.visibility).toBe("PUBLIC");
    });

    it("restricts STUDENT publishing by placing proposal in DRAFT / PENDING_REVIEW", async () => {
      const req = new NextRequest("http://localhost/api/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token_student",
        },
        body: JSON.stringify({ action: "PUBLISH", data: validProblemData }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe(ProblemStatus.DRAFT);
      expect(json.verificationStatus).toBe(VerificationStatus.PENDING_REVIEW);
      expect(json.problem.posterId).toBe("user_student_1");
      expect(json.problem.posterRole).toBe(UserRole.STUDENT);
      expect(json.problem.visibility).toBe("PRIVATE");
    });

    it("allows saving a draft for any authenticated user with partial data", async () => {
      const req = new NextRequest("http://localhost/api/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token_student",
        },
        body: JSON.stringify({ action: "DRAFT", data: { title: "Draft Idea" } }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe(ProblemStatus.DRAFT);
      expect(json.verificationStatus).toBe(VerificationStatus.UNVERIFIED);
      expect(json.problem.title).toBe("Draft Idea");
    });

    it("updates existing draft without creating duplicate when problemId is supplied", async () => {
      const req = new NextRequest("http://localhost/api/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token_student",
        },
        body: JSON.stringify({
          action: "DRAFT",
          problemId: "mock_student_draft_1",
          data: { title: "Updated Draft Title", domain: "Clean Energy" },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.problemId).toBe("mock_student_draft_1");
      expect(json.problem.title).toBe("Updated Draft Title");
    });

    it("transitions an existing draft to PENDING_REVIEW upon student Submit for Review", async () => {
      const req = new NextRequest("http://localhost/api/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token_student",
        },
        body: JSON.stringify({
          action: "PUBLISH",
          problemId: "mock_student_draft_1",
          data: validProblemData,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.problemId).toBe("mock_student_draft_1");
      expect(json.verificationStatus).toBe(VerificationStatus.PENDING_REVIEW);
      expect(json.problem.title).toBe(validProblemData.title);
    });

    it("forbids unauthorized users from modifying another user's problem", async () => {
      const req = new NextRequest("http://localhost/api/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token_student",
        },
        body: JSON.stringify({
          action: "DRAFT",
          problemId: "mock_prob_123", // Owned by user_faculty_1
          data: { title: "Hijacked Title" },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("fetches problems created by the authenticated user via GET", async () => {
      const req = new NextRequest("http://localhost/api/problems", {
        method: "GET",
        headers: {
          Authorization: "Bearer token_faculty",
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.problems)).toBe(true);
    });
  });
});
