import { ProblemFitResult } from "@/lib/utils/matching-engine";

export enum ApplicationStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  SHORTLISTED = "SHORTLISTED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
}

export interface Application {
  id: string;
  problemId: string;
  applicantId: string; // The student who applied (or team leader)
  teamId?: string;     // If applied as a team
  proposal: string;
  motivation: string;
  
  fitScore?: number;
  synergyBridgeFitScore?: number;
  prismFitScore?: number;
  fitResult?: ProblemFitResult; // Snapshot at submission time
  
  status: ApplicationStatus;
  
  createdAt: number;
  updatedAt: number;
  
  reviewedAt?: number;
  reviewedBy?: string;
  rejectionReason?: string;
}
