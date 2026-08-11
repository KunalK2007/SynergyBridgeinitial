export interface ProjectMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  message: string;
  attachmentId?: string;
  createdAt: number;
  editedAt?: number;
  deletedAt?: number;
}
