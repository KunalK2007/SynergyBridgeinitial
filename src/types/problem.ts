import { UserRole } from "./auth";

export enum ProblemStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  PAUSED = "PAUSED",
  CLOSED = "CLOSED",
  ARCHIVED = "ARCHIVED",
}

export enum VerificationStatus {
  UNVERIFIED = "UNVERIFIED",
  PENDING_REVIEW = "PENDING_REVIEW",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export enum ProblemType {
  INDUSTRY = "INDUSTRY",
  GOVERNMENT = "GOVERNMENT",
  ACADEMIC = "ACADEMIC",
  SOCIAL_IMPACT = "SOCIAL_IMPACT",
  OPEN_INNOVATION = "OPEN_INNOVATION",
}

export enum DifficultyLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT",
}

export enum GeographicScope {
  LOCAL = "LOCAL",
  DISTRICT = "DISTRICT",
  STATE = "STATE",
  NATIONAL = "NATIONAL",
  GLOBAL = "GLOBAL",
}

export enum TeamPreference {
  INDIVIDUAL = "INDIVIDUAL",
  SMALL_TEAM = "SMALL_TEAM",
  LARGE_TEAM = "LARGE_TEAM",
  ANY = "ANY",
}

export enum RequirementType {
  REQUIRED = "REQUIRED",
  PREFERRED = "PREFERRED",
}

export enum SkillImportance {
  REQUIRED = "REQUIRED",
  IMPORTANT = "IMPORTANT",
  OPTIONAL = "OPTIONAL",
}

export enum SkillLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT",
}

export enum ConstraintType {
  BUDGET = "BUDGET",
  TIME = "TIME",
  HARDWARE = "HARDWARE",
  CONNECTIVITY = "CONNECTIVITY",
  PRIVACY = "PRIVACY",
  SECURITY = "SECURITY",
  REGULATORY = "REGULATORY",
  DATA_AVAILABILITY = "DATA_AVAILABILITY",
  OTHER = "OTHER",
}

export interface SkillRequirement {
  skillId: string;
  name: string;
  category: string;
  requirementType: RequirementType;
  importance: SkillImportance;
  minimumLevel: SkillLevel;
}

export interface Constraint {
  type: ConstraintType;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface FundingSummary {
  fundingEnabled: boolean;
  fundingAmount?: number;
  fundingCurrency?: string;
  fundingDescription?: string;
}

export interface ProblemAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  sizeBytes: number;
}

export interface Problem {
  id: string;
  title: string;
  shortDescription: string;
  problemStatement: string;
  whyItMatters: string;
  expectedOutcome: string;
  successCriteria: string[];
  
  // Taxonomy
  domain: string;
  subDomain?: string;
  problemType: ProblemType;
  difficulty: DifficultyLevel;
  
  // Skills & DNA
  skills: SkillRequirement[];
  tags: string[];
  
  // Impact
  sdgs: number[]; // 1-17
  targetBeneficiaries: string[];
  geographicScope: GeographicScope;
  region?: string;
  district?: string;
  state?: string;
  country?: string;
  
  // Constraints & Logistics
  constraints: Constraint[];
  teamPreference: TeamPreference;
  minTeamSize?: number;
  maxTeamSize?: number;
  estimatedDurationWeeks?: number;
  deadline?: number; // timestamp
  
  // Funding
  funding?: FundingSummary;
  
  // Meta
  status: ProblemStatus;
  visibility: "PUBLIC" | "PRIVATE";
  attachments?: ProblemAttachment[];
  
  // Poster info (denormalized for read performance)
  posterId: string;
  posterRole: UserRole;
  organizationName?: string;
  
  // Moderation (protected fields)
  verificationStatus: VerificationStatus;
  moderatedBy?: string;
  moderatedAt?: number;
  moderationReason?: string;
  
  createdAt: number;
  updatedAt: number;
}
