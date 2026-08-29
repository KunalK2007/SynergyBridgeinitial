import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/institutional/route";
import { DecodedIdToken } from "firebase-admin/auth";
import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { UserRole } from "@/types/auth";

vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: { verifyIdToken: vi.fn() },
  adminDb: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ institutionId: "inst_1" }) })
      })
    })
  }
}));

vi.mock("@/lib/ai/institutional-service", () => ({
  generateInstitutionalInsight: vi.fn().mockResolvedValue({ answer: "Success" })
}));

describe("Institutional AI API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should deny unauthorized requests without Bearer token", async () => {
    const req = new NextRequest("http://localhost/api/ai/institutional", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should deny requests for STUDENT roles", async () => {
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({ uid: "user_1", role: UserRole.STUDENT } as unknown as DecodedIdToken);
    const req = new NextRequest("http://localhost/api/ai/institutional", {
      method: "POST",
      headers: { Authorization: "Bearer token" },
      body: JSON.stringify({ question: "test" })
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("should allow ADMIN role", async () => {
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({ uid: "user_1", role: UserRole.ADMIN, institutionId: "inst_1" } as unknown as DecodedIdToken);
    const req = new NextRequest("http://localhost/api/ai/institutional", {
      method: "POST",
      headers: { Authorization: "Bearer token" },
      body: JSON.stringify({ question: "test" })
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.answer).toBe("Success");
  });
});
