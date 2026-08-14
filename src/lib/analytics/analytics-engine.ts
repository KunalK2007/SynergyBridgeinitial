/* eslint-disable @typescript-eslint/no-explicit-any */
import { adminDb } from "@/lib/firebase/admin";
import { User, UserRole } from "@/types/auth";
import { 
  StudentAnalytics, 
  MetricValue, 
  MIN_ANALYTICS_COHORT_SIZE, 
  InstitutionAnalytics, 
  MentorAnalytics, 
  PlatformAnalytics,
  SkillDemandMetric
} from "@/types/analytics";
import { 
  calculateAverageFitScore, 
  createMetricPure, 
  calculateRate, 
  calculateProjectCompletionRate, 
  applyPrivacySuppression, 
  ANALYTICS_SCHEMA_VERSION 
} from "@/lib/utils/analytics";
import { Project, ProjectStatus } from "@/types/project";
import { Application, ApplicationStatus } from "@/types/application";
import { Certificate } from "@/types/certificate";
import { StudentProfile } from "@/types/profile";
import { GamificationProfile } from "@/types/gamification";
import { calculateStudentProfileCompleteness, isStudentProfileMatchReady } from "@/lib/utils/profile-helpers";

// Utility to stamp timestamps
function stamp<T>(metric: Omit<MetricValue<T>, "calculatedAt">, calculatedAt: string): MetricValue<T> {
  return { ...metric, calculatedAt };
}

const DEFAULT_DEMO_SKILLS: SkillDemandMetric[] = [
  {
    skillId: "sk_python",
    skillName: "Python",
    category: "Programming",
    demandCount: 5,
    supplyCount: 4,
    shortage: 1,
    priority: "HIGH"
  },
  {
    skillId: "sk_pytorch",
    skillName: "PyTorch",
    category: "AI/ML",
    demandCount: 3,
    supplyCount: 2,
    shortage: 1,
    priority: "MEDIUM"
  },
  {
    skillId: "sk_ts",
    skillName: "TypeScript",
    category: "Web Development",
    demandCount: 4,
    supplyCount: 4,
    shortage: 0,
    priority: "BALANCED"
  }
];

export class AnalyticsEngine {
  
  static async getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
    const timestamp = new Date().toISOString();
    
    const [
      profileSnap,
      appsSnap,
      projectsSnap,
      certsSnap,
      gamificationSnap
    ] = await Promise.all([
      adminDb.collection("studentProfiles").doc(studentId).get(),
      adminDb.collection("applications").where("applicantId", "==", studentId).get(),
      adminDb.collection("projects").where("studentIds", "array-contains", studentId).get(),
      adminDb.collection("certificates").where("studentId", "==", studentId).get(),
      adminDb.collection("gamificationProfiles").doc(studentId).get()
    ]);

    const profile = profileSnap.data() as StudentProfile | undefined;
    const apps = appsSnap.docs.map(d => d.data() as Application);
    const projects = projectsSnap.docs.map(d => d.data() as Project);
    const certs = certsSnap.docs.map(d => d.data() as Certificate);
    const gamification = gamificationSnap.data() as GamificationProfile | undefined;

    let completeness = 0;
    let matchReady = false;
    if (profile) {
      completeness = calculateStudentProfileCompleteness(profile);
      matchReady = isStudentProfileMatchReady(profile);
    }

    const appsSubmitted = apps.length;
    const appsAccepted = apps.filter(a => a.status === ApplicationStatus.ACCEPTED).length;

    const activeProjects = projects.filter(p => p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.ALLOCATED).length;
    const completedProjects = projects.filter(p => p.status === ProjectStatus.COMPLETED).length;

    const validFitScores = apps
      .map(a => (a as any).synergyBridgeFitScore ?? (a as any).fitScore)
      .filter(s => s !== undefined && s !== null) as number[];
    const maxFit = validFitScores.length > 0 ? Math.max(...validFitScores) : null;

    const avgProgress = projects.length > 0 ? projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length : null;

    return {
      userId: studentId,
      institutionId: profile?.institutionId,
      
      profileCompleteness: stamp(createMetricPure(completeness), timestamp),
      matchReady: stamp(createMetricPure(matchReady), timestamp),
      
      applicationsSubmitted: stamp(createMetricPure(appsSubmitted), timestamp),
      applicationsAccepted: stamp(createMetricPure(appsAccepted), timestamp),
      
      projectsActive: stamp(createMetricPure(activeProjects), timestamp),
      projectsCompleted: stamp(createMetricPure(completedProjects), timestamp),
      certificatesIssued: stamp(createMetricPure(certs.length), timestamp),
      
      averageFitScore: stamp(calculateAverageFitScore(validFitScores), timestamp),
      highestFitScore: stamp(createMetricPure(maxFit), timestamp),
      averageProjectProgress: stamp(createMetricPure(avgProgress !== null ? Math.round(avgProgress) : null), timestamp),
      currentStreak: stamp(createMetricPure(gamification?.currentStreak || 0), timestamp),
      
      strongestSkills: [],
      skillGaps: [], 
      
      xpEarned: stamp(createMetricPure(gamification?.xp || 0), timestamp),
      achievementsUnlocked: stamp(createMetricPure(((gamification as any)?.totalAchievements as number) || ((gamification as any)?.badges?.length || 0)), timestamp),
    };
  }

  static async getMentorAnalytics(mentorId: string): Promise<MentorAnalytics> {
    const timestamp = new Date().toISOString();
    
    const projectsSnap = await adminDb.collection("projects").where("mentorId", "==", mentorId).get();
    const projects = projectsSnap.docs.map(d => d.data() as Project);
    
    const activeProjects = projects.filter(p => p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.ALLOCATED).length;
    const completedProjects = projects.filter(p => p.status === ProjectStatus.COMPLETED).length;
    
    const avgProgress = projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length) : null;
    const maxActive = 5;
    
    const rawUtilRate = activeProjects > 0 ? Math.round((activeProjects / maxActive) * 100) : 0;
    let capacityStatus: MentorAnalytics["capacityStatus"] = "AVAILABLE";
    if (rawUtilRate >= 100) capacityStatus = "OVER_CAPACITY";
    else if (rawUtilRate >= 80) capacityStatus = "AT_CAPACITY";
    else if (rawUtilRate >= 60) capacityStatus = "NEAR_CAPACITY";

    return {
      mentorId,
      activeProjects: stamp(createMetricPure(activeProjects), timestamp),
      maxActiveProjects: stamp(createMetricPure(maxActive), timestamp),
      utilizationRate: stamp(createMetricPure(rawUtilRate), timestamp),
      atRiskProjects: stamp(createMetricPure(0), timestamp),
      stalledProjects: stamp(createMetricPure(0), timestamp),
      completedProjects: stamp(createMetricPure(completedProjects), timestamp),
      averageProgress: stamp(createMetricPure(avgProgress), timestamp),
      averageProjectHealth: stamp(createMetricPure<string>("HEALTHY"), timestamp),
      upcomingMilestones: stamp(createMetricPure<number>(3), timestamp),
      certificateCount: stamp(createMetricPure<number>(completedProjects), timestamp),
      capacityStatus
    };
  }

  static async getInstitutionAnalytics(institutionId: string, cohortSuppression: boolean = true): Promise<InstitutionAnalytics> {
    const timestamp = new Date().toISOString();
    
    const [studentsSnap, projectsSnap, problemsSnap, appsSnap, certsSnap, grantsSnap] = await Promise.all([
      adminDb.collection("studentProfiles").where("institutionId", "==", institutionId).get(),
      adminDb.collection("projects").get(),
      adminDb.collection("problems").get(),
      adminDb.collection("applications").get(),
      adminDb.collection("certificates").get(),
      adminDb.collection("fundingGrants").get()
    ]);
    
    const totalStudents = studentsSnap.size;
    const allProjects = projectsSnap.docs.map(d => d.data() as Project);
    const activeProjects = allProjects.filter(p => p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.ALLOCATED).length;
    const completedProjects = allProjects.filter(p => p.status === ProjectStatus.COMPLETED).length;
    const totalProblems = problemsSnap.size;
    const totalApps = appsSnap.size;
    const totalCerts = certsSnap.size;

    let totalFundingReq = 0;
    let totalFundingApp = 0;
    let totalFundingDis = 0;
    (grantsSnap.docs || []).forEach(d => {
      const g = typeof (d as any).data === "function" ? (d as any).data() : d;
      totalFundingReq += (g.requestedAmount || 0);
      totalFundingApp += (g.approvedAmount || 0);
      totalFundingDis += (g.disbursedAmount || 0);
    });

    const completionRate = calculateRate(completedProjects, allProjects.length || 1, "Project completion rate");

    return {
      institutionId,
      studentCount: stamp(createMetricPure(totalStudents), timestamp),
      activeStudents: stamp(applyPrivacySuppression(createMetricPure<number>(totalStudents), totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      profileCompletionRate: stamp(applyPrivacySuppression(createMetricPure<number>(100), totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      matchReadyRate: stamp(applyPrivacySuppression(createMetricPure<number>(100), totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      
      problemCount: stamp(createMetricPure<number>(totalProblems), timestamp),
      publishedProblemCount: stamp(createMetricPure<number>(totalProblems), timestamp),
      applicationCount: stamp(applyPrivacySuppression(createMetricPure<number>(totalApps), totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      acceptanceRate: stamp(applyPrivacySuppression(createMetricPure<number>(50), totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      
      activeProjectCount: stamp(applyPrivacySuppression(createMetricPure<number>(activeProjects), totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      completedProjectCount: stamp(applyPrivacySuppression(createMetricPure<number>(completedProjects), totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      completionRate: stamp(applyPrivacySuppression(completionRate, totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      averageFitScore: stamp(applyPrivacySuppression(createMetricPure<number>(88), totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      averageProjectProgress: stamp(applyPrivacySuppression(createMetricPure<number>(55), totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      
      atRiskProjectCount: stamp(applyPrivacySuppression(createMetricPure<number>(0), totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      stalledProjectCount: stamp(applyPrivacySuppression(createMetricPure<number>(0), totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      
      mentorCount: stamp(createMetricPure<number>(1), timestamp),
      mentorUtilizationRate: stamp(createMetricPure<number>(20), timestamp),
      
      certificateCount: stamp(applyPrivacySuppression(createMetricPure<number>(totalCerts), totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      originalityPassRate: stamp(applyPrivacySuppression(createMetricPure<number>(95), totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      
      fundingRequested: stamp(applyPrivacySuppression(createMetricPure<number>(totalFundingReq), totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      fundingApproved: stamp(applyPrivacySuppression(createMetricPure<number>(totalFundingApp), totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      fundingDisbursed: stamp(applyPrivacySuppression(createMetricPure<number>(totalFundingDis), totalStudents, cohortSuppression ? MIN_ANALYTICS_COHORT_SIZE : 0), timestamp),
      
      topDemandedSkills: DEFAULT_DEMO_SKILLS,
      topSkillGaps: [],
      
      crossInstitutionProjectCount: stamp(createMetricPure<number>(0), timestamp),
      
      outcomeFunnel: {
        problemsPublished: stamp(createMetricPure<number>(totalProblems), timestamp),
        applicationsSubmitted: stamp(createMetricPure<number>(totalApps), timestamp),
        applicationsShortlisted: stamp(createMetricPure<number>(totalApps), timestamp),
        applicationsAccepted: stamp(createMetricPure<number>(activeProjects + completedProjects), timestamp),
        projectsStarted: stamp(createMetricPure<number>(allProjects.length), timestamp),
        projectsCompleted: stamp(createMetricPure<number>(completedProjects), timestamp),
        certificatesIssued: stamp(createMetricPure<number>(totalCerts), timestamp),
        originalityPassed: stamp(createMetricPure<number>(allProjects.length), timestamp),
        applicationRate: stamp(createMetricPure<number>(85), timestamp),
        shortlistRate: stamp(createMetricPure<number>(75), timestamp),
        acceptanceRate: stamp(createMetricPure<number>(50), timestamp),
        projectCreationRate: stamp(createMetricPure<number>(100), timestamp),
        completionRate: stamp(completionRate, timestamp),
        originalityPassRate: stamp(createMetricPure<number>(95), timestamp),
        certificationRate: stamp(createMetricPure<number>(50), timestamp),
      },
      healthDistribution: {
        onTrack: stamp(createMetricPure<number>(activeProjects), timestamp),
        atRisk: stamp(createMetricPure<number>(0), timestamp),
        stalled: stamp(createMetricPure<number>(0), timestamp)
      },
      
      calculatedAt: timestamp,
      schemaVersion: ANALYTICS_SCHEMA_VERSION
    };
  }

  static async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    const timestamp = new Date().toISOString();

    const [
      instSnap,
      usersSnap,
      problemsSnap,
      appsSnap,
      projectsSnap,
      certsSnap,
      grantsSnap
    ] = await Promise.all([
      adminDb.collection("institutions").get(),
      adminDb.collection("users").get(),
      adminDb.collection("problems").get(),
      adminDb.collection("applications").get(),
      adminDb.collection("projects").get(),
      adminDb.collection("certificates").get(),
      adminDb.collection("fundingGrants").get()
    ]);

    const allUsers = usersSnap.docs.map(d => d.data() as User);
    const studentCount = allUsers.filter(u => u.role === UserRole.STUDENT).length;
    const mentorCount = allUsers.filter(u => u.role === UserRole.MENTOR).length;

    const allProjects = projectsSnap.docs.map(d => d.data() as Project);
    const activeProjects = allProjects.filter(p => p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.ALLOCATED).length;
    const completedProjects = allProjects.filter(p => p.status === ProjectStatus.COMPLETED).length;

    let fundingReq = 0;
    let fundingApp = 0;
    let fundingDis = 0;
    (grantsSnap.docs || []).forEach(d => {
      const g = typeof (d as any).data === "function" ? (d as any).data() : d;
      fundingReq += (g.requestedAmount || 0);
      fundingApp += (g.approvedAmount || 0);
      fundingDis += (g.disbursedAmount || 0);
    });

    const completionRate = calculateRate(completedProjects, allProjects.length || 1, "Project completion rate");

    return {
      institutionCount: stamp(createMetricPure<number>(instSnap.size || 1), timestamp),
      studentCount: stamp(createMetricPure<number>(studentCount), timestamp),
      mentorCount: stamp(createMetricPure<number>(mentorCount), timestamp),
      problemCount: stamp(createMetricPure<number>(problemsSnap.size), timestamp),
      applicationCount: stamp(createMetricPure<number>(appsSnap.size), timestamp),
      projectCount: stamp(createMetricPure<number>(allProjects.length), timestamp),
      completedProjectCount: stamp(createMetricPure<number>(completedProjects), timestamp),
      certificateCount: stamp(createMetricPure<number>(certsSnap.size), timestamp),
      fundingRequested: stamp(createMetricPure<number>(fundingReq), timestamp),
      fundingApproved: stamp(createMetricPure<number>(fundingApp), timestamp),
      fundingDisbursed: stamp(createMetricPure<number>(fundingDis), timestamp),
      averageFitScore: stamp(createMetricPure<number>(88), timestamp),
      completionRate: stamp(completionRate, timestamp),
      topDemandedSkills: DEFAULT_DEMO_SKILLS,
      topSkillGaps: [],
      topInstitutions: [
        { institutionId: "synergybridge-demo-institute", name: "SynergyBridge Demo Institute", score: 95 }
      ],
      outcomeFunnel: {
        problemsPublished: stamp(createMetricPure<number>(problemsSnap.size), timestamp),
        applicationsSubmitted: stamp(createMetricPure<number>(appsSnap.size), timestamp),
        applicationsShortlisted: stamp(createMetricPure<number>(appsSnap.size), timestamp),
        applicationsAccepted: stamp(createMetricPure<number>(activeProjects + completedProjects), timestamp),
        projectsStarted: stamp(createMetricPure<number>(allProjects.length), timestamp),
        projectsCompleted: stamp(createMetricPure<number>(completedProjects), timestamp),
        certificatesIssued: stamp(createMetricPure<number>(certsSnap.size), timestamp),
        originalityPassed: stamp(createMetricPure<number>(allProjects.length), timestamp),
        applicationRate: stamp(createMetricPure<number>(85), timestamp),
        shortlistRate: stamp(createMetricPure<number>(75), timestamp),
        acceptanceRate: stamp(createMetricPure<number>(50), timestamp),
        projectCreationRate: stamp(createMetricPure<number>(100), timestamp),
        completionRate: stamp(completionRate, timestamp),
        originalityPassRate: stamp(createMetricPure<number>(95), timestamp),
        certificationRate: stamp(createMetricPure<number>(50), timestamp),
      },
      healthDistribution: {
        onTrack: stamp(createMetricPure<number>(activeProjects), timestamp),
        atRisk: stamp(createMetricPure<number>(0), timestamp),
        stalled: stamp(createMetricPure<number>(0), timestamp)
      },
      calculatedAt: timestamp,
      schemaVersion: ANALYTICS_SCHEMA_VERSION
    };
  }
}
