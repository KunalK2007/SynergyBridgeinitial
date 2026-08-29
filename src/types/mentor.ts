export enum MentorAvailability {
  AVAILABLE = "AVAILABLE",
  LIMITED = "LIMITED",
  UNAVAILABLE = "UNAVAILABLE"
}

export interface MentorProfile {
  id: string; // matches userId
  userId: string;
  organization?: string;
  institutionId?: string;
  expertiseAreas: string[];
  preferredDomains: string[];
  availabilityStatus: MentorAvailability;
  bio?: string;
  yearsOfExperience?: number;
  maxActiveProjects: number;
  currentProjectCount: number;
  isAvailable: boolean;
  createdAt: number;
  updatedAt: number;
}
