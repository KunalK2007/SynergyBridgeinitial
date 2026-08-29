export enum CertificateStatus {
  DRAFT = "DRAFT",
  ISSUED = "ISSUED",
  REVOKED = "REVOKED",
  EXPIRED = "EXPIRED",
}

export enum BlockchainStatus {
  NOT_REQUESTED = "NOT_REQUESTED",
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  FAILED = "FAILED",
  MOCK = "MOCK",
}

export enum ExternalCredentialStatus {
  NOT_REQUESTED = "NOT_REQUESTED",
  PENDING = "PENDING",
  SYNCED = "SYNCED",
  FAILED = "FAILED",
  MOCK = "MOCK",
}

export interface Certificate {
  id: string;
  verificationId: string;

  projectId: string;
  applicationId: string;
  problemId: string;
  studentId: string;

  studentName: string;
  projectTitle: string;
  problemTitle: string;

  institution?: string;
  department?: string;
  course?: string;

  issuedAt?: string;
  revokedAt?: string;
  expiresAt?: string;
  revocationReason?: string;

  status: CertificateStatus;

  certificateHash: string;

  blockchainStatus: BlockchainStatus;
  blockchainTransactionId?: string;

  digiLockerStatus: ExternalCredentialStatus;
  abcStatus: ExternalCredentialStatus;

  academicCredits?: number;

  originalityScore?: number;
  originalityReportId?: string;

  issuerId: string;
  issuerName?: string;
  isDemo?: boolean;

  eligibilitySnapshot?: {
    taskCompletionPercentage: number;
    completedMilestones: boolean;
    originalityScore: number;
    eligibilityCheckedAt: string;
  };

  createdAt: string;
  updatedAt: string;
}
