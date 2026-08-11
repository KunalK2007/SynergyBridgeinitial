export enum TeamStatus {
  FORMING = "FORMING",
  READY = "READY",
  SUBMITTED = "SUBMITTED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  ARCHIVED = "ARCHIVED",
}

export interface Team {
  id: string;
  name: string;
  problemId?: string;
  leaderId: string;
  memberIds: string[];
  institutionIds: string[];
  maxMembers: number;
  status: TeamStatus;
  createdAt: number;
  updatedAt: number;
}
