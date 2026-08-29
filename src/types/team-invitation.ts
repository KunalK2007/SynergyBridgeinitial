export enum InvitationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  CANCELLED = "CANCELLED",
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  inviterId: string;
  inviteeId: string;
  status: InvitationStatus;
  createdAt: number;
  respondedAt?: number;
}
