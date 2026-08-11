export enum ProjectStatus {
  ALLOCATED = "ALLOCATED",
  IN_PROGRESS = "IN_PROGRESS",
  ON_HOLD = "ON_HOLD",
  READY_FOR_EVALUATION = "READY_FOR_EVALUATION",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface Project {
  id: string;
  problemId: string;
  applicationId: string;
  teamId?: string;
  studentIds: string[];
  mentorId?: string;
  coordinatorId?: string;
  title: string;
  status: ProjectStatus;
  progress: number;
  startDate: number;
  targetCompletionDate?: number;
  createdAt: number;
  updatedAt: number;
}
