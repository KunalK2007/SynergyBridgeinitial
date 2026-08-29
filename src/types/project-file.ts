export enum FileCategory {
  DOCUMENT = "DOCUMENT",
  REPORT = "REPORT",
  PRESENTATION = "PRESENTATION",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  CODE = "CODE",
  EVIDENCE = "EVIDENCE",
  OTHER = "OTHER"
}

export interface ProjectFile {
  id: string;
  projectId: string;
  uploadedBy: string;
  fileName: string;
  contentType: string;
  size: number;
  storagePath: string;
  downloadUrl?: string;
  category: FileCategory;
  createdAt: number;
}
