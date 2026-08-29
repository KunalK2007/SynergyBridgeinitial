import { describe, it, expect, vi, beforeEach } from "vitest";
import { FundingService } from "@/lib/server/funding-service";
import { adminDb } from "@/lib/firebase/admin";
import { UserRole } from "@/types/auth";
import { FUNDING_TIERS } from "@/lib/constants/funding";
import { GamificationEventType } from "@/types/gamification";
import { serverEnv } from "@/lib/server/environment";

vi.mock("@/lib/server/environment", () => ({
  serverEnv: { SYNERGYBRIDGE_OPERATION_MODE: "NORMAL" }
}));

// Mock Firebase Admin
vi.mock("@/lib/firebase/admin", () => {
  const transactionMock = {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
  };

  return {
    adminDb: {
      runTransaction: vi.fn((callback) => callback(transactionMock)),
      collection: vi.fn(() => ({
        doc: vi.fn((id) => ({
          id: id || "mocked-doc-id",
          get: vi.fn(async () => ({ exists: false, data: () => ({}) })),
          collection: vi.fn(() => ({
            doc: vi.fn(() => ({ id: "mock-activity-id", get: vi.fn() })),
          })),
        })),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(),
      })),
    },
  };
});

// Mock gamification service
vi.mock("@/lib/server/gamification-service", () => ({
  processGamificationEvent: vi.fn(),
}));

describe("Funding Trust Architecture", () => {
  let fundingService: FundingService;
  let tMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    fundingService = new FundingService();
    // Capture the transaction object mock used by runTransaction
    const runTransaction = adminDb.runTransaction as any;
    // We want to dynamically mock the transaction behavior based on tests
  });

  const setupTransactionMock = (mockGrant: any, mockUsers: Record<string, any>) => {
    const tMock = {
      get: vi.fn(async (ref: any) => {
        if (ref.id === mockGrant.id) {
          return { exists: true, data: () => mockGrant };
        }
        if (mockUsers && mockUsers[ref.id]) {
          return { exists: true, data: () => mockUsers[ref.id] };
        }
        return { exists: false };
      }),
      set: vi.fn(),
      update: vi.fn(),
    };
    (adminDb.runTransaction as any).mockImplementation((cb: any) => cb(tMock));
    return tMock;
  };

  describe("signMilestone KYC Guards", () => {
    it("rejects signature from non-existent user", async () => {
      const grant = { id: "grant-1", projectId: "p-1", milestones: [{ id: "m-1" }] };
      setupTransactionMock(grant, {});

      await expect(
        fundingService.signMilestone("grant-1", "m-1", "ghost-id", "Ghost", "MENTOR")
      ).rejects.toThrow("Signer ghost-id not found.");
    });

    it("rejects signature from unverified mentor", async () => {
      const grant = { id: "grant-1", projectId: "p-1", milestones: [{ id: "m-1" }] };
      const users = {
        "mentor-1": { role: UserRole.MENTOR, isInstitutionVerified: false },
      };
      setupTransactionMock(grant, users);

      await expect(
        fundingService.signMilestone("grant-1", "m-1", "mentor-1", "Mentor", "MENTOR")
      ).rejects.toThrow("Signer mentor-1 is not institutionally verified.");
    });

    it("rejects mentor signature from incorrect role", async () => {
      const grant = { id: "grant-1", projectId: "p-1", milestones: [{ id: "m-1" }] };
      const users = {
        "student-1": { role: UserRole.STUDENT, isInstitutionVerified: true },
      };
      setupTransactionMock(grant, users);

      await expect(
        fundingService.signMilestone("grant-1", "m-1", "student-1", "Student", "MENTOR")
      ).rejects.toThrow("Signer student-1 is not a valid mentor or faculty.");
    });

    it("accepts signature from verified mentor", async () => {
      const grant = { id: "grant-1", projectId: "p-1", milestones: [{ id: "m-1" }] };
      const users = {
        "mentor-1": { role: UserRole.MENTOR, isInstitutionVerified: true },
      };
      const tMock = setupTransactionMock(grant, users);

      const result = await fundingService.signMilestone("grant-1", "m-1", "mentor-1", "Mentor", "MENTOR");
      expect(result.milestones[0].approvals?.mentorApprovedBy).toBe("mentor-1");
      expect(tMock.set).toHaveBeenCalled(); // Audit logging
    });

    it("rejects signature from nonexistent sponsor", async () => {
      const grant = { id: "grant-1", projectId: "p-1", milestones: [{ id: "m-1" }] };
      setupTransactionMock(grant, {});

      await expect(
        fundingService.signMilestone("grant-1", "m-1", "ghost-id", "Ghost", "SPONSOR")
      ).rejects.toThrow("Signer ghost-id not found.");
    });

    it("rejects signature from unverified sponsor", async () => {
      const grant = { id: "grant-1", projectId: "p-1", milestones: [{ id: "m-1" }] };
      const users = {
        "sponsor-1": { role: UserRole.INDUSTRY, isInstitutionVerified: false },
      };
      setupTransactionMock(grant, users);

      await expect(
        fundingService.signMilestone("grant-1", "m-1", "sponsor-1", "Sponsor", "SPONSOR")
      ).rejects.toThrow("Signer sponsor-1 is not institutionally verified.");
    });

    it("rejects sponsor signature from incorrect role", async () => {
      const grant = { id: "grant-1", projectId: "p-1", milestones: [{ id: "m-1" }] };
      const users = {
        "student-1": { role: UserRole.STUDENT, isInstitutionVerified: true },
      };
      setupTransactionMock(grant, users);

      await expect(
        fundingService.signMilestone("grant-1", "m-1", "student-1", "Student", "SPONSOR")
      ).rejects.toThrow("Signer student-1 is not a valid sponsor.");
    });

    it("accepts signature from verified sponsor", async () => {
      const grant = { id: "grant-1", projectId: "p-1", milestones: [{ id: "m-1" }] };
      const users = {
        "sponsor-1": { role: UserRole.INDUSTRY, isInstitutionVerified: true },
      };
      setupTransactionMock(grant, users);

      const result = await fundingService.signMilestone("grant-1", "m-1", "sponsor-1", "Sponsor", "SPONSOR");
      expect(result.milestones[0].approvals?.sponsorApprovedBy).toBe("sponsor-1");
    });
  });

  describe("Disbursement Approvals", () => {
    it("rejects unverified disburser", async () => {
      const grant = { id: "grant-1", projectId: "p-1", status: "APPROVED", tier: "SEED", milestones: [{ id: "m-1", amount: 100 }] };
      const users = {
        "user-1": { role: UserRole.STUDENT, isInstitutionVerified: false },
      };
      setupTransactionMock(grant, users);

      await expect(
        fundingService.disburseMilestone("grant-1", "m-1", "user-1", "User")
      ).rejects.toThrow("Unverified users cannot disburse funding.");
    });

    it("rejects disbursement if AI originality missing", async () => {
      const grant = { 
        id: "grant-1", projectId: "p-1", status: "APPROVED", tier: "SEED", 
        milestones: [{ id: "m-1", amount: 100, approvals: { mentorApprovedBy: "m1" } }] 
      };
      const users = { "admin-1": { role: UserRole.ADMIN, isInstitutionVerified: true } };
      setupTransactionMock(grant, users);

      await expect(
        fundingService.disburseMilestone("grant-1", "m-1", "admin-1", "Admin")
      ).rejects.toThrow("Cannot disburse: AI Originality approval missing.");
    });

    it("rejects disbursement if mentor approval missing", async () => {
      const grant = { 
        id: "grant-1", projectId: "p-1", status: "APPROVED", tier: "SEED", 
        milestones: [{ id: "m-1", amount: 100, approvals: { aiOriginalityPassed: true } }] 
      };
      const users = { "admin-1": { role: UserRole.ADMIN, isInstitutionVerified: true } };
      setupTransactionMock(grant, users);

      await expect(
        fundingService.disburseMilestone("grant-1", "m-1", "admin-1", "Admin")
      ).rejects.toThrow("Cannot disburse: Mentor approval missing.");
    });

    it("rejects GROWTH/INNOVATION disbursement if sponsor approval missing", async () => {
      const grant = { 
        id: "grant-1", projectId: "p-1", status: "APPROVED", tier: "GROWTH", 
        milestones: [{ id: "m-1", amount: 1000, approvals: { aiOriginalityPassed: true, mentorApprovedBy: "m1" } }] 
      };
      const users = { "admin-1": { role: UserRole.ADMIN, isInstitutionVerified: true } };
      setupTransactionMock(grant, users);

      await expect(
        fundingService.disburseMilestone("grant-1", "m-1", "admin-1", "Admin")
      ).rejects.toThrow("Cannot disburse: Sponsor approval required for GROWTH tier.");
    });

    it("accepts SEED disbursement without sponsor approval (only AI + Mentor)", async () => {
      const grant = { 
        id: "grant-1", projectId: "p-1", status: "APPROVED", tier: "SEED", 
        milestones: [{ id: "m-1", amount: 100, approvals: { aiOriginalityPassed: true, mentorApprovedBy: "m1" } }] 
      };
      const users = { "admin-1": { role: UserRole.ADMIN, isInstitutionVerified: true } };
      setupTransactionMock(grant, users);

      const result = await fundingService.disburseMilestone("grant-1", "m-1", "admin-1", "Admin");
      expect(result.status).toBe("DISBURSED");
      expect(result.milestones[0].status).toBe("RELEASED");
    });

    it("accepts GROWTH disbursement with all approvals", async () => {
      const grant = { 
        id: "grant-1", projectId: "p-1", status: "APPROVED", tier: "GROWTH", 
        milestones: [{ id: "m-1", amount: 1000, approvals: { aiOriginalityPassed: true, mentorApprovedBy: "m1", sponsorApprovedBy: "s1" } }] 
      };
      const users = { "admin-1": { role: UserRole.ADMIN, isInstitutionVerified: true } };
      const tMock = setupTransactionMock(grant, users);

      const result = await fundingService.disburseMilestone("grant-1", "m-1", "admin-1", "Admin");
      expect(result.status).toBe("DISBURSED");
      expect(tMock.set).toHaveBeenCalled(); // Audit record created
    });
  });

  describe("Recovery Mode (The Blackout)", () => {
    it("rejects funding operations when in RECOVERY mode", async () => {
      serverEnv.SYNERGYBRIDGE_OPERATION_MODE = "RECOVERY";
      
      await expect(
        fundingService.requestFunding("p-1", "SEED", 1000, "user", "User")
      ).rejects.toThrow("SynergyBridge is currently in Recovery Mode. Funding operations are temporarily paused.");
      
      await expect(
        fundingService.disburseMilestone("grant-1", "m-1", "admin-1", "Admin")
      ).rejects.toThrow("SynergyBridge is currently in Recovery Mode. Funding operations are temporarily paused.");

      serverEnv.SYNERGYBRIDGE_OPERATION_MODE = "NORMAL";
    });
  });
});
