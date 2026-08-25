import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/certificates/[verificationId]/route";
import { NextRequest } from "next/server";

const mockGet = vi.fn();

vi.mock("@/lib/firebase/admin", () => {
  return {
    adminDb: {
      collection: () => ({
        where: () => ({
          limit: () => ({
            get: mockGet,
          }),
        }),
      }),
    },
  };
});

describe("Certificate Verification API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (url: string) => {
    return new NextRequest(new URL(url, "http://localhost:3000"));
  };

  it("successful DEMO-CERT-001 verification", async () => {
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          data: () => ({
            verificationId: "DEMO-CERT-001",
            status: "ISSUED",
            projectTitle: "CropGuard AI Complete",
            problemTitle: "AI Crop Disease Detection",
            studentName: "Priya Sharma",
            institution: "SynergyBridge Demo University",
            issuedAt: "2023-01-01T00:00:00.000Z",
            certificateHash: "demo-hash-12345",
            blockchainStatus: "MOCK",
          }),
        },
      ],
    });

    const context = { params: Promise.resolve({ verificationId: "DEMO-CERT-001" }) };
    const response = await GET(createRequest("/api/certificates/DEMO-CERT-001"), context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.status).toBe("ISSUED");
    expect(data.verificationId).toBe("DEMO-CERT-001");
    expect(data.blockchain.simulated).toBe(true);
  });

  it("invalid/nonexistent certificate", async () => {
    mockGet.mockResolvedValueOnce({
      empty: true,
      docs: [],
    });

    const context = { params: Promise.resolve({ verificationId: "INVALID-CERT-001" }) };
    const response = await GET(createRequest("/api/certificates/INVALID-CERT-001"), context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.valid).toBe(false);
    expect(data.status).toBe("NOT_FOUND");
  });

  it("malformed verification request", async () => {
    // Pass empty verificationId
    const context = { params: Promise.resolve({ verificationId: "" }) };
    const response = await GET(createRequest("/api/certificates/"), context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.valid).toBe(false);
  });

  it("tampered certificate/hash", async () => {
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          data: () => ({
            verificationId: "TAMPERED-CERT-001",
            status: "REVOKED",
            revokedAt: "2023-01-02T00:00:00.000Z",
            projectTitle: "Tampered Project",
          }),
        },
      ],
    });

    const context = { params: Promise.resolve({ verificationId: "TAMPERED-CERT-001" }) };
    const response = await GET(createRequest("/api/certificates/TAMPERED-CERT-001"), context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
    expect(data.status).toBe("REVOKED");
    expect(data.revokedAt).toBe("2023-01-02T00:00:00.000Z");
  });
});
