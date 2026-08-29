export enum FundingStatus {
  NOT_REQUESTED = "NOT_REQUESTED",
  REQUESTED = "REQUESTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  DISBURSED = "DISBURSED",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
}

export interface FundingMilestone {
  id: string;
  title: string;
  amount: number;
  status: "PENDING" | "RELEASED" | "COMPLETED";
  dueDate?: string;
  releasedAt?: string;
  releasedBy?: string;
  approvals?: {
    aiOriginalityPassed: boolean;
    mentorApprovedBy?: string;
    sponsorApprovedBy?: string;
  };
}

export interface FundingGrant {
  id: string;
  projectId: string;

  requestedAmount: number;
  approvedAmount?: number;
  disbursedAmount?: number;

  currency: "INR" | "USD";

  tier: "SEED" | "GROWTH" | "INNOVATION";

  source: string;

  status: FundingStatus;

  originalityScore?: number;
  projectQualityScore?: number;

  milestones: FundingMilestone[];

  requestedBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;

  createdAt: string;
  updatedAt: string;
}
