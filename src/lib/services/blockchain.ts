import { Certificate, BlockchainStatus } from "@/types/certificate";
import crypto from "crypto";

export interface BlockchainCredentialService {
  createCredentialHash(certificate: Partial<Certificate>): Promise<{ hash: string }>;
  anchorCredential(certificateHash: string): Promise<{
    status: BlockchainStatus;
    transactionId?: string;
  }>;
}

export class MockBlockchainAdapter implements BlockchainCredentialService {
  async createCredentialHash(certificate: Partial<Certificate>): Promise<{ hash: string }> {
    // Deterministic hash based on certificate core fields
    const dataString = `${certificate.id}-${certificate.projectId}-${certificate.studentId}-${certificate.issuedAt}`;
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');
    return { hash };
  }

  async anchorCredential(certificateHash: string): Promise<{ status: BlockchainStatus; transactionId?: string }> {
    // Simulated network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      status: BlockchainStatus.MOCK,
      transactionId: `mock-tx-${certificateHash.substring(0, 16)}`,
    };
  }
}

export const blockchainService = new MockBlockchainAdapter();
