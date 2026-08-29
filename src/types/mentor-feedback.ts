export enum FeedbackTargetType {
  TASK = "TASK",
  MILESTONE = "MILESTONE",
  STUDENT = "STUDENT",
  PROJECT = "PROJECT"
}

export interface MentorFeedback {
  id: string;
  projectId: string;
  mentorId: string;
  studentId?: string; // or teamId, if applicable
  targetType: FeedbackTargetType;
  targetId?: string; // id of task, milestone, etc.
  rating?: number;
  feedback: string;
  createdAt: number;
  updatedAt: number;
}
