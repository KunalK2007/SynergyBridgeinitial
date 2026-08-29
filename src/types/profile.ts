import { SkillLevel } from "./problem";

export interface StudentSkill {
  skillId: string;
  level?: SkillLevel; // Optional if migrated from legacy and unconfirmed
  needsConfirmation?: boolean;
}

export interface StudentProfile {
  userId: string;
  institutionId?: string;
  department?: string;
  course?: string;
  year?: number;
  semester?: number;
  skills: (StudentSkill | string)[]; // Union to support legacy strings before normalization, but strict typing expects StudentSkill
  legacySkills?: string[]; // Preserved unmapped skills
  interests: string[];
  preferredDomains: string[];
  resumeUrl?: string;
  shareResumeWithApplicants: boolean;
}

export interface ApplicationCandidateProfile {
  studentId: string;
  displayName: string;
  institutionId?: string;
  department?: string;
  course?: string;
  year?: number;
  skills: StudentSkill[];
  interests: string[];
  preferredDomains: string[];
  resumeUrl?: string; // Only populated if shareResumeWithApplicants is true
}

export interface MentorProfile {
  userId: string;
  expertiseAreas: string[];
  organization?: string;
  availability: string;
}

export interface IndustryProfile {
  userId: string;
  organizationName: string;
  industrySector: string;
  verificationStatus: string;
}

export interface GovernmentProfile {
  userId: string;
  department: string;
  region: string;
  verificationStatus: string;
}

export interface FacultyProfile {
  userId: string;
  institutionId: string;
  department: string;
}
