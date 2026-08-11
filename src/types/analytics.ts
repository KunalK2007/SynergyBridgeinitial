export const MIN_ANALYTICS_COHORT_SIZE = 5;

export type AnalyticsTimeRange =
  | "ALL_TIME"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "LAST_90_DAYS"
  | "LAST_6_MONTHS"
  | "CURRENT_YEAR"
  | "CUSTOM";

export type AnalyticsScope =
  | "STUDENT"
  | "MENTOR"
  | "INSTITUTION"
  | "PROBLEM_POSTER"
  | "ADMIN"
  | "PLATFORM";

export interface MetricValue<T> {
  value: T | null;
  available: boolean;
  reason?: "NO_DATA" | "INSUFFICIENT_COHORT" | "NOT_APPLICABLE" | "PERMISSION_DENIED";
  calculatedAt?: string;
  sourceDescription?: string;
}

export interface SkillDemandMetric {
  skillId: string;
  skillName: string;
  category: string;
  demandCount: number;
  supplyCount: number;
  shortage: number;
  priority: "HIGH" | "MEDIUM" | "LOW" | "BALANCED" | "SURPLUS";
}

export interface SkillGapMetric {
  skillId: string;
  skillName: string;
  category: string;
  missingCount: number;
  weakCount: number;
}

export interface OutcomeFunnel {
  problemsPublished: MetricValue<number>;
  applicationsSubmitted: MetricValue<number>;
  applicationsShortlisted: MetricValue<number>;
  applicationsAccepted: MetricValue<number>;
  projectsStarted: MetricValue<number>;
  projectsCompleted: MetricValue<number>;
  certificatesIssued: MetricValue<number>;
  originalityPassed: MetricValue<number>;
  
  // Rates
  applicationRate: MetricValue<number>; // apps / problems (avg apps per problem)
  shortlistRate: MetricValue<number>; // shortlisted / submitted
  acceptanceRate: MetricValue<number>; // accepted / submitted
  projectCreationRate: MetricValue<number>; // started / accepted
  completionRate: MetricValue<number>; // completed / started
  originalityPassRate: MetricValue<number>; // originality passed / completed
  certificationRate: MetricValue<number>; // certificates / completed
}

export interface ProjectHealthDistribution {
  onTrack: MetricValue<number>;
  atRisk: MetricValue<number>;
  stalled: MetricValue<number>;
}

export interface TimeSeriesPoint {
  date: string; // ISO Date String
  value: number;
}

export interface StudentAnalytics {
  userId: string;
  institutionId?: string;
  
  profileCompleteness: MetricValue<number>;
  matchReady: MetricValue<boolean>;
  
  applicationsSubmitted: MetricValue<number>;
  applicationsAccepted: MetricValue<number>;
  
  projectsActive: MetricValue<number>;
  projectsCompleted: MetricValue<number>;
  certificatesIssued: MetricValue<number>;
  
  averageFitScore: MetricValue<number>;
  highestFitScore: MetricValue<number>;
  averageProjectProgress: MetricValue<number>;
  currentStreak: MetricValue<number>;
  
  strongestSkills: SkillDemandMetric[]; // Reused structure for simplicity, or just string[]
  skillGaps: SkillGapMetric[];
  
  xpEarned: MetricValue<number>;
  achievementsUnlocked: MetricValue<number>;
}

export interface MentorAnalytics {
  mentorId: string;
  institutionId?: string;
  
  activeProjects: MetricValue<number>;
  maxActiveProjects: MetricValue<number>;
  utilizationRate: MetricValue<number>;
  
  atRiskProjects: MetricValue<number>;
  stalledProjects: MetricValue<number>;
  completedProjects: MetricValue<number>;
  
  averageProgress: MetricValue<number>;
  averageProjectHealth: MetricValue<string>;
  upcomingMilestones: MetricValue<number>;
  certificateCount: MetricValue<number>;
  
  capacityStatus: "AVAILABLE" | "NEAR_CAPACITY" | "AT_CAPACITY" | "OVER_CAPACITY";
}

export interface InstitutionAnalytics {
  institutionId: string;
  
  studentCount: MetricValue<number>;
  activeStudents: MetricValue<number>;
  profileCompletionRate: MetricValue<number>;
  matchReadyRate: MetricValue<number>;
  
  problemCount: MetricValue<number>;
  publishedProblemCount: MetricValue<number>;
  applicationCount: MetricValue<number>;
  acceptanceRate: MetricValue<number>;
  
  activeProjectCount: MetricValue<number>;
  completedProjectCount: MetricValue<number>;
  completionRate: MetricValue<number>;
  averageFitScore: MetricValue<number>;
  averageProjectProgress: MetricValue<number>;
  
  atRiskProjectCount: MetricValue<number>;
  stalledProjectCount: MetricValue<number>;
  
  mentorCount: MetricValue<number>;
  mentorUtilizationRate: MetricValue<number>;
  
  certificateCount: MetricValue<number>;
  originalityPassRate: MetricValue<number>;
  
  fundingRequested: MetricValue<number>;
  fundingApproved: MetricValue<number>;
  fundingDisbursed: MetricValue<number>;
  
  topDemandedSkills: SkillDemandMetric[];
  topSkillGaps: SkillGapMetric[];
  
  crossInstitutionProjectCount: MetricValue<number>;
  
  outcomeFunnel: OutcomeFunnel;
  healthDistribution: ProjectHealthDistribution;
  
  calculatedAt: string;
  schemaVersion: string;
}

export interface PlatformAnalytics {
  institutionCount: MetricValue<number>;
  studentCount: MetricValue<number>;
  mentorCount: MetricValue<number>;
  
  problemCount: MetricValue<number>;
  applicationCount: MetricValue<number>;
  projectCount: MetricValue<number>;
  completedProjectCount: MetricValue<number>;
  certificateCount: MetricValue<number>;
  
  fundingRequested: MetricValue<number>;
  fundingApproved: MetricValue<number>;
  fundingDisbursed: MetricValue<number>;
  
  averageFitScore: MetricValue<number>;
  completionRate: MetricValue<number>;
  
  topDemandedSkills: SkillDemandMetric[];
  topSkillGaps: SkillGapMetric[];
  
  topInstitutions: { institutionId: string; name: string; score: number }[]; // custom scoring for ranking
  
  outcomeFunnel: OutcomeFunnel;
  healthDistribution: ProjectHealthDistribution;
  
  calculatedAt: string;
  schemaVersion: string;
}

export interface ProblemAnalytics {
  problemId: string;
  applicationCount: MetricValue<number>;
  averageFitScore: MetricValue<number>;
  acceptedCount: MetricValue<number>;
  projectCount: MetricValue<number>;
  completedProjectCount: MetricValue<number>;
  
  requiredSkillCoverage: MetricValue<number>;
  skillGaps: SkillGapMetric[];
  
  teamApplicationCount: MetricValue<number>;
  individualApplicationCount: MetricValue<number>;
}
