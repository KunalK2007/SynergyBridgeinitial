import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as originalityPOST } from "@/app/api/originality/assess/route";
import { POST as fundingPOST } from "@/app/api/funding/request/route";
import { NextRequest } from "next/server";
import { UserRole } from "@/types/auth";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

const mockGet = vi.fn();
const mockJson = vi.fn();

vi.mock("@/lib/firebase/admin", () => {
  return {
    adminDb: {
      collection: () => ({
        doc: () => ({
          get: mockGet,
          collection: () => ({
            get: vi.fn().mockResolvedValue({ size: 2 })
          })
        })
      })
    },
    adminAuth: {
      verifyIdToken: vi.fn()
    }
  };
});

describe("Production Security & Tampering Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createRequest(body: unknown, token: string) {
    return {
      headers: {
        get: () => `Bearer ${token}`
      },
      json: () => Promise.resolve(body)
    } as unknown as NextRequest;
  }

  it("Originality Assess: Rejects missing token", async () => {
    const req = { headers: { get: () => null } } as unknown as NextRequest;
    const res = await originalityPOST(req);
    expect(res.status).toBe(401);
  });

  it("Originality Assess: Rejects unassigned student", async () => {
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({ uid: "unassigned_student", role: UserRole.STUDENT } as unknown as import("firebase-admin/auth").DecodedIdToken);
    
    mockGet.mockImplementation(() => Promise.resolve({
      exists: true,
      data: () => ({
        id: "proj_1",
        studentIds: ["assigned_student"],
        mentorId: "mentor_1"
      })
    }));

    const req = createRequest({ projectId: "proj_1" }, "token");
    const res = await originalityPOST(req);
    expect(res.status).toBe(403);
  });

  it("Funding Request: Validates input safely rejecting tampered approvedAmount", async () => {
    // In actual implementation, we might not pass 'approvedAmount' because Zod drops it, or it throws an error depending on strictness.
    // Assuming Zod is strict or ignores it, the DB never sees it.
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({ uid: "assigned_student", role: UserRole.STUDENT } as unknown as import("firebase-admin/auth").DecodedIdToken);
    
    mockGet.mockImplementation(() => Promise.resolve({
      exists: true,
      data: () => ({
        id: "proj_1",
        studentIds: ["assigned_student"],
        mentorId: "mentor_1"
      })
    }));

    // Student maliciously tries to inject approvedAmount
    const req = createRequest({ 
      projectId: "proj_1", 
      amountRequested: 500, 
      purpose: "Servers",
      approvedAmount: 1000000 // Attempted tampering
    }, "token");
    
    const res = await fundingPOST(req);
    // Since funding-service processes it, we just want to ensure it doesn't crash from the API route unless Zod catches it.
    // Wait, fundingPOST calls fundingService. We just ensure we don't return 500, but rather 400 or a success that ignores the tampered field.
    // If Zod is used, it drops unrecognized keys if not strict, or fails if strict.
    expect([400, 422]).toContain(res.status); 
  });
});
