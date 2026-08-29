import { describe, it, expect, vi, beforeEach } from "vitest";
import { fundingService } from "@/lib/server/funding-service";
import { certificateService } from "@/lib/server/certificate-service";
import { FundingStatus } from "@/types/funding";
import { CertificateStatus } from "@/types/certificate";

const mockTransactionGet = vi.fn();
const mockTransactionSet = vi.fn();
const mockTransactionUpdate = vi.fn();

vi.mock("@/lib/firebase/admin", () => {
  return {
    adminDb: {
      runTransaction: vi.fn((callback) => {
        return callback({
          get: mockTransactionGet,
          set: mockTransactionSet,
          update: mockTransactionUpdate,
        });
      }),
      collection: () => {
        const collectionMock = {
          where: () => collectionMock,
          limit: () => collectionMock,
          orderBy: () => collectionMock,
          doc: () => ({
            get: vi.fn(),
            collection: () => collectionMock
          }),
          get: mockTransactionGet
        };
        return collectionMock;
      }
    }
  };
});

describe("Idempotency Controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Funding: Duplicate request throws error instead of duplicating", async () => {
    // Simulate an existing grant
    mockTransactionGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        status: FundingStatus.REQUESTED
      }),
      ref: {}
    });

    await expect(fundingService.requestFunding(
      "proj_1",
      "SEED",
      100,
      "stu_1",
      "Student"
    )).rejects.toThrow(/already pending/i);
    
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it("Certificates: Duplicate issuance returns existing certificate", async () => {
    // Simulate an existing certificate
    mockTransactionGet.mockResolvedValueOnce({
      exists: true,
      docs: [
        {
          id: "cert_1",
          data: () => ({
            id: "cert_1",
            status: CertificateStatus.ISSUED
          })
        }
      ]
    });

    const cert = await certificateService.issueCertificate("proj_1", "stu_1", "sys_1", "System");
    
    expect(mockTransactionSet).not.toHaveBeenCalled();
    expect(cert).toHaveProperty("id", "cert_1");
  });
});
