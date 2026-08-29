export enum MilestoneStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  BLOCKED = "BLOCKED"
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  targetDate: number;
  status: MilestoneStatus;
  completionPercentage: number;
  createdBy: string;
  completedAt?: number;
  completedBy?: string;
  evidenceFileId?: string;
  createdAt: number;
  updatedAt: number;
}
