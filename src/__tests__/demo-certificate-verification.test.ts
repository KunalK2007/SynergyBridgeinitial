import { describe, it, expect, vi, beforeEach } from "vitest";
import { SYNTHETIC_DEMO_CERTIFICATES } from "@/lib/constants/demo-certificates";
import { CertificateStatus, BlockchainStatus } from "@/types/certificate";
import { NextRequest } from "next/server";

const mockDocs: Array<{ data: () => unknown }> = [];

vi.mock("@/lib/firebase/admin", () => {
  return {
    adminDb: {
      collection: () => {
        const collectionMock = {
          where: () => collectionMock,
          limit: () => collectionMock,
          get: vi.fn().mockImplementation(async () => ({
            empty: mockDocs.length === 0,
            docs: mockDocs
          })),
          doc: () => ({
            get: vi.fn().mockImplementation(async () => ({
              exists: mockDocs.length > 0,
              data: () => mockDocs[0]?.data()
            }))
          })
        };
        return collectionMock;
      }
    }
  };
});

// Import route handler after mocking
import { GET } from "@/app/api/certificates/[verificationId]/route";

describe("Demo Certificate Verification & Provenance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocs.length = 0;
  });

  it("Synthetic demo certificates list contains valid completed project certificates", () => {
    expect(SYNTHETIC_DEMO_CERTIFICATES.length).toBeGreaterThanOrEqual(2);

    const wasteWiseCert = SYNTHETIC_DEMO_CERTIFICATES.find(c => c.verificationId === "SB-DEMO-WW95-2026");
    expect(wasteWiseCert).toBeDefined();
    expect(wasteWiseCert?.studentName).toBe("Aarav Sharma");
    expect(wasteWiseCert?.status).toBe(CertificateStatus.ISSUED);
    expect(wasteWiseCert?.projectId).toBe("demo_proj_7");
    expect(wasteWiseCert?.isDemo).toBe(true);
    expect(wasteWiseCert?.blockchainStatus).toBe(BlockchainStatus.MOCK);
    expect(wasteWiseCert?.originalityScore).toBe(96);
    expect(wasteWiseCert?.eligibilitySnapshot?.taskCompletionPercentage).toBe(100);

    const skillMatchCert = SYNTHETIC_DEMO_CERTIFICATES.find(c => c.verificationId === "SB-DEMO-SM92-2026");
    expect(skillMatchCert).toBeDefined();
    expect(skillMatchCert?.studentName).toBe("Aarav Sharma");
    expect(skillMatchCert?.status).toBe(CertificateStatus.ISSUED);
    expect(skillMatchCert?.projectId).toBe("demo_proj_8");
    expect(skillMatchCert?.isDemo).toBe(true);
    expect(skillMatchCert?.blockchainStatus).toBe(BlockchainStatus.MOCK);
    expect(wasteWiseCert?.originalityScore).toBeGreaterThanOrEqual(85);
  });

  it("Public Verification API verifies valid synthetic demo certificate without exposing PII", async () => {
    const req = new NextRequest("http://localhost:3000/api/certificates/SB-DEMO-WW95-2026");
    const res = await GET(req, {
      params: Promise.resolve({ verificationId: "SB-DEMO-WW95-2026" })
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.valid).toBe(true);
    expect(data.status).toBe("ISSUED");
    expect(data.verificationId).toBe("SB-DEMO-WW95-2026");
    expect(data.studentName).toBe("Aarav Sharma");
    expect(data.projectTitle).toContain("WasteWise");
    expect(data.institution).toBe("SynergyBridge Demo Institute");
    expect(data.isDemo).toBe(true);
    expect(data.blockchain.simulated).toBe(true);

    // Verify STRICT NO-PII Exposure:
    expect(data.email).toBeUndefined();
    expect(data.phone).toBeUndefined();
    expect(data.studentId).toBeUndefined();
    expect(data.issuerId).toBeUndefined();
    expect(data.funding).toBeUndefined();
    expect(data.rawTokens).toBeUndefined();
  });

  it("Public Verification API returns 404 for unknown verificationId", async () => {
    const req = new NextRequest("http://localhost:3000/api/certificates/UNKNOWN-NONEXISTENT-ID");
    const res = await GET(req, {
      params: Promise.resolve({ verificationId: "UNKNOWN-NONEXISTENT-ID" })
    });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.status).toBe("NOT_FOUND");
  });

  it("Public Verification API correctly flags REVOKED certificates", async () => {
    mockDocs.push({
      data: () => ({
        id: "cert_revoked_test",
        verificationId: "REVOKED-ID-123",
        status: "REVOKED",
        revokedAt: "2026-08-28T00:00:00.000Z",
      })
    });

    const req = new NextRequest("http://localhost:3000/api/certificates/REVOKED-ID-123");
    const res = await GET(req, {
      params: Promise.resolve({ verificationId: "REVOKED-ID-123" })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.status).toBe("REVOKED");
    expect(data.revokedAt).toBeDefined();
  });
});
