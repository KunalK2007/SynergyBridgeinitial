/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Phase 4D - Production Seed Demo
 * 
 * Generates a consistent, safe demonstration dataset for production review.
 * Includes complete synthetic demo accounts, mock data for all phases.
 * 
 * WARNING: Do not use this script in an actual live production environment
 * unless you are explicitly setting up a demo tenant.
 */

import { adminDb, adminAuth } from '../src/lib/firebase/admin';
import { UserRole, AccountStatus, User } from '../src/types/auth';
import { ProblemType, DifficultyLevel, GeographicScope, TeamPreference, SkillLevel, ProblemStatus, VerificationStatus, Problem } from '../src/types/problem';
import { ApplicationStatus, Application } from '../src/types/application';
import { ProjectStatus, Project } from '../src/types/project';
import { Task, TaskStatus, TaskPriority } from '../src/types/task';
import { Milestone, MilestoneStatus } from '../src/types/milestone';
import { GamificationProfile } from '../src/types/gamification';
import { ProjectMessage } from '../src/types/project-message';
import { ProjectFile, FileCategory } from '../src/types/project-file';
import { ProjectActivity } from '../src/types/project-activity';
import { FundingGrant, FundingStatus } from '../src/types/funding';
import { Certificate, CertificateStatus, BlockchainStatus, ExternalCredentialStatus } from '../src/types/certificate';

if (process.env.NODE_ENV === 'production' && process.env.ENABLE_PRODUCTION_SEED !== 'true') {
  console.error("🚨 ERROR: Attempted to run demo seed in production without explicit override.");
  console.error("Set ENABLE_PRODUCTION_SEED=true to bypass this safety guard.");
  process.exit(1);
}

const DEMO_ACCOUNTS = [
  {
    name: "Aarav Sharma",
    email: "student.demo@synergybridge.local",
    password: "SBStudent@2026!",
    role: UserRole.STUDENT
  },
  {
    name: "Ananya Patil",
    email: "student2.demo@synergybridge.local",
    password: "SBStudent2@2026!",
    role: UserRole.STUDENT
  },
  {
    name: "Dr. Rahul Mehta",
    email: "mentor.demo@synergybridge.local",
    password: "SBMentor@2026!",
    role: UserRole.MENTOR
  },
  {
    name: "Neha Deshmukh",
    email: "reviewer.demo@synergybridge.local",
    password: "SBReviewer@2026!",
    role: UserRole.INDUSTRY
  },
  {
    name: "Prof. Vikram Joshi",
    email: "institution.demo@synergybridge.local",
    password: "SBInstitution@2026!",
    role: UserRole.FACULTY
  },
  {
    name: "Priya Kulkarni",
    email: "faculty.demo@synergybridge.local",
    password: "SBFaculty@2026!",
    role: UserRole.FACULTY
  },
  {
    name: "System Demo Admin",
    email: "admin.demo@synergybridge.local",
    password: "SBAdmin@2026!",
    role: UserRole.ADMIN
  }
];

async function seedProductionDemo() {
  console.log("🌱 Seeding Production Demo Dataset...");
  const now = Date.now();
  const demoInstitutionId = "synergybridge-demo-institute";
  const usersRef = adminDb.collection('users');
  const institutionRef = adminDb.collection('institutions').doc(demoInstitutionId);

  // 1. Create Demo Institution
  await institutionRef.set({
    id: demoInstitutionId,
    name: "SynergyBridge Demo Institute",
    isDemo: true,
    createdAt: now
  }, { merge: true });
  console.log("✅ Seeded Demo Institution");

  // 2. Create Auth Accounts & Users
  const userUIDs: Record<string, string> = {};
  
  for (const account of DEMO_ACCOUNTS) {
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(account.email);
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && (error as {code: string}).code === 'auth/user-not-found') {
        userRecord = await adminAuth.createUser({
          email: account.email,
          password: account.password,
          displayName: account.name,
        });
      } else {
        throw error;
      }
    }
    
    const uid = userRecord.uid;
    userUIDs[account.email] = uid;

    const userData: Partial<User> = {
      uid,
      email: account.email,
      displayName: account.name,
      role: account.role,
      accountStatus: AccountStatus.ACTIVE,
      profileCompleted: true,
      createdAt: now,
      updatedAt: now,
    };
    if (account.role === UserRole.FACULTY || account.role === UserRole.STUDENT) {
      userData.institutionId = demoInstitutionId;
    }
    
    await usersRef.doc(uid).set({ ...userData, isDemo: true }, { merge: true });

    // Profile generation
    if (account.role === UserRole.STUDENT) {
      await adminDb.collection('studentProfiles').doc(uid).set({
        userId: uid,
        institutionId: demoInstitutionId,
        department: "Computer Science & AI",
        course: "B.Tech",
        year: 3,
        skills: [
          { skillId: "sk_python", name: "Python", category: "Programming", level: SkillLevel.ADVANCED },
          { skillId: "sk_pytorch", name: "PyTorch", category: "AI/ML", level: SkillLevel.INTERMEDIATE },
          { skillId: "sk_cv", name: "Computer Vision", category: "AI/ML", level: SkillLevel.INTERMEDIATE },
          { skillId: "sk_ts", name: "TypeScript", category: "Web Development", level: SkillLevel.ADVANCED }
        ],
        interests: ["Edge AI", "AgriTech", "Computer Vision"],
        preferredDomains: ["Agriculture & AI", "Technology"],
        shareResumeWithApplicants: true
      }, { merge: true });
      
      // Init gamification profile
      await adminDb.collection("gamificationProfiles").doc(uid).set({
        userId: uid,
        xp: 1850,
        level: 6,
        lifetimeXp: 1850,
        currentStreak: 7,
        longestStreak: 14,
        totalProjectsCompleted: 1,
        totalTasksCompleted: 18,
        totalMilestonesCompleted: 6,
        totalProblemsSolved: 3,
        totalAchievements: 6,
        showOnLeaderboard: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as GamificationProfile, { merge: true });

    } else if (account.role === UserRole.MENTOR) {
      const mentorData = {
        id: uid,
        userId: uid,
        displayName: account.name,
        name: account.name,
        email: account.email,
        expertiseAreas: ["Agricultural AI", "Edge Deep Learning", "Cloud Architecture"],
        organization: "Agricultural AI Research Labs",
        availabilityStatus: "AVAILABLE",
        currentProjectCount: 1,
        maxActiveProjects: 5,
        rating: 4.9,
        reviewsCount: 12,
        createdAt: now,
        updatedAt: now
      };
      await adminDb.collection('mentorProfiles').doc(uid).set(mentorData, { merge: true });
      await adminDb.collection('mentors').doc(uid).set(mentorData, { merge: true });
    }
  }

  // Create additional synthetic students for leaderboard/analytics
  for (let i = 1; i <= 6; i++) {
    const syntheticUid = `synthetic_student_${i}`;
    const syntheticEmail = `synthetic${i}.demo@synergybridge.local`;
    try {
      await adminAuth.getUserByEmail(syntheticEmail);
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as {code: string}).code === 'auth/user-not-found') {
        await adminAuth.createUser({
          uid: syntheticUid,
          email: syntheticEmail,
          password: "SBStudent@2026!",
          displayName: `Synthetic Student ${i}`,
        });
      }
    }
    await usersRef.doc(syntheticUid).set({
      uid: syntheticUid,
      email: syntheticEmail,
      displayName: `Synthetic Student ${i}`,
      role: UserRole.STUDENT,
      accountStatus: AccountStatus.ACTIVE,
      profileCompleted: true,
      institutionId: demoInstitutionId,
      createdAt: now,
      updatedAt: now,
      isDemo: true
    }, { merge: true });
  }

  console.log("✅ Seeded users and profiles");

  // 3. Create Problems
  const problemsRef = adminDb.collection('problems');
  const primaryPosterId = userUIDs["reviewer.demo@synergybridge.local"];
  
  const problemsList = [
    {
      id: "demo_prob_1",
      title: "AI-Based Crop Disease Detection",
      domain: "Agriculture",
      shortDescription: "Develop an AI-assisted system that detects common crop diseases from leaf images and provides farmers with early alerts and recommended preventive actions.",
      problemStatement: "Crop diseases cause massive yield losses. Farmers need an accessible way to detect diseases early using computer vision.",
      whyItMatters: "Early detection safeguards food security and farmer livelihood.",
      expectedOutcome: "A deployable low-latency edge AI model and farmer advisory mobile interface with >90% diagnosis accuracy.",
      difficulty: DifficultyLevel.INTERMEDIATE,
      organizationName: "AgriTech Innovation Lab",
      skills: [
        { skillId: "sk_python", name: "Python", category: "Programming", minimumLevel: SkillLevel.INTERMEDIATE, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any },
        { skillId: "sk_ml", name: "Machine Learning", category: "AI/ML", minimumLevel: SkillLevel.INTERMEDIATE, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any }
      ]
    },
    {
      id: "demo_prob_2",
      title: "Intelligent Phishing Detection Platform",
      domain: "Cybersecurity",
      shortDescription: "Build a system that analyzes emails, URLs, and message patterns to identify potential phishing attempts and provide explainable risk indicators.",
      problemStatement: "Phishing attacks are becoming increasingly sophisticated. We need a system to analyze message patterns and identify risks.",
      whyItMatters: "Protecting users from phishing saves millions in stolen assets and data breaches.",
      expectedOutcome: "A platform providing explainable risk indicators for analyzed emails and URLs.",
      difficulty: DifficultyLevel.INTERMEDIATE,
      organizationName: "SecureNet Labs",
      skills: [
        { skillId: "sk_python", name: "Python", category: "Programming", minimumLevel: SkillLevel.INTERMEDIATE, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any },
        { skillId: "sk_cyber", name: "Cybersecurity", category: "Cybersecurity", minimumLevel: SkillLevel.INTERMEDIATE, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any }
      ]
    },
    {
      id: "demo_prob_3",
      title: "AI-Assisted Medical Appointment Prioritization",
      domain: "Healthcare",
      shortDescription: "Design a decision-support system that helps healthcare administrators prioritize appointment requests based on urgency and available resources.",
      problemStatement: "Healthcare facilities struggle with backlogs. We need an AI to prioritize based on patient urgency.",
      whyItMatters: "Efficient prioritization can save lives and reduce wait times for critical patients.",
      expectedOutcome: "A decision-support system for appointment scheduling.",
      difficulty: DifficultyLevel.ADVANCED,
      organizationName: "HealthTech Research Center",
      skills: [
        { skillId: "sk_python", name: "Python", category: "Programming", minimumLevel: SkillLevel.ADVANCED, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any },
        { skillId: "sk_data", name: "Data Analytics", category: "Data", minimumLevel: SkillLevel.INTERMEDIATE, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any }
      ]
    },
    {
      id: "demo_prob_4",
      title: "Personalized Learning Recommendation Engine",
      domain: "Education",
      shortDescription: "Create a recommendation engine that analyzes student learning activity and suggests relevant learning resources and practice topics.",
      problemStatement: "Students have different learning paces. A personalized engine is needed to suggest resources.",
      whyItMatters: "Personalized learning improves student engagement and academic outcomes.",
      expectedOutcome: "A recommendation engine integrated with a learning platform.",
      difficulty: DifficultyLevel.INTERMEDIATE,
      organizationName: "EduNova Foundation",
      skills: [
        { skillId: "sk_react", name: "React", category: "Development", minimumLevel: SkillLevel.INTERMEDIATE, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any },
        { skillId: "sk_ml", name: "Machine Learning", category: "AI/ML", minimumLevel: SkillLevel.INTERMEDIATE, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any }
      ]
    },
    {
      id: "demo_prob_5",
      title: "Smart Fraud Risk Detection",
      domain: "FinTech",
      shortDescription: "Develop a machine-learning model that identifies suspicious transaction patterns and generates explainable fraud-risk scores.",
      problemStatement: "Financial fraud is a growing concern. We need a robust model to detect suspicious transactions.",
      whyItMatters: "Detecting fraud early protects consumers and financial institutions.",
      expectedOutcome: "An ML model that generates explainable fraud-risk scores.",
      difficulty: DifficultyLevel.ADVANCED,
      organizationName: "FinSecure Technologies",
      skills: [
        { skillId: "sk_python", name: "Python", category: "Programming", minimumLevel: SkillLevel.ADVANCED, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any },
        { skillId: "sk_sql", name: "SQL", category: "Data", minimumLevel: SkillLevel.ADVANCED, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any }
      ]
    },
    {
      id: "demo_prob_6",
      title: "Urban Waste Collection Optimization",
      domain: "Smart Cities",
      shortDescription: "Develop an optimization system that recommends efficient waste-collection routes using historical collection data and demand patterns.",
      problemStatement: "Inefficient waste collection leads to overflowing bins and high fuel consumption.",
      whyItMatters: "Optimized routes save costs and reduce the carbon footprint of municipal services.",
      expectedOutcome: "A system recommending efficient waste-collection routes.",
      difficulty: DifficultyLevel.ADVANCED,
      organizationName: "SmartCity Innovation Hub",
      skills: [
        { skillId: "sk_python", name: "Python", category: "Programming", minimumLevel: SkillLevel.ADVANCED, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any },
        { skillId: "sk_iot", name: "IoT", category: "Hardware", minimumLevel: SkillLevel.INTERMEDIATE, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any }
      ]
    },
    {
      id: "demo_prob_7",
      title: "Campus Energy Consumption Intelligence",
      domain: "Climate & Environment",
      shortDescription: "Build an analytics platform that identifies unusual energy consumption patterns and recommends opportunities for reducing campus energy usage.",
      problemStatement: "Campuses consume large amounts of energy. We need an analytics platform to identify waste.",
      whyItMatters: "Reducing energy usage lowers costs and supports climate sustainability goals.",
      expectedOutcome: "An analytics platform that highlights unusual consumption patterns.",
      difficulty: DifficultyLevel.INTERMEDIATE,
      organizationName: "GreenCampus Initiative",
      skills: [
        { skillId: "sk_iot", name: "IoT", category: "Hardware", minimumLevel: SkillLevel.INTERMEDIATE, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any },
        { skillId: "sk_data", name: "Data Analytics", category: "Data", minimumLevel: SkillLevel.INTERMEDIATE, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any }
      ]
    },
    {
      id: "demo_prob_8",
      title: "AI-Powered Public Service Feedback Analyzer",
      domain: "Artificial Intelligence",
      shortDescription: "Create a system that analyzes citizen feedback and automatically categorizes recurring issues to help institutions prioritize improvements.",
      problemStatement: "Institutions receive thousands of feedback messages. We need AI to categorize and summarize them.",
      whyItMatters: "Efficient categorization helps institutions address critical public issues faster.",
      expectedOutcome: "A system that categorizes recurring issues and visualizes trends.",
      difficulty: DifficultyLevel.INTERMEDIATE,
      organizationName: "Civic Innovation Lab",
      skills: [
        { skillId: "sk_nlp", name: "NLP", category: "AI/ML", minimumLevel: SkillLevel.INTERMEDIATE, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any },
        { skillId: "sk_python", name: "Python", category: "Programming", minimumLevel: SkillLevel.INTERMEDIATE, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any }
      ]
    }
  ];

  for (const p of problemsList) {
    const prob: Problem = {
      id: p.id,
      title: p.title,
      shortDescription: p.shortDescription,
      problemStatement: p.problemStatement,
      whyItMatters: p.whyItMatters,
      expectedOutcome: p.expectedOutcome,
      successCriteria: ["Accuracy > 90%", "Inference Latency < 200ms", "Zero false-negative for critical conditions"],
      domain: p.domain,
      problemType: ProblemType.INDUSTRY,
      difficulty: p.difficulty,
      skills: p.skills,
      tags: ["innovation", p.domain.toLowerCase()],
      sdgs: [9],
      targetBeneficiaries: ["General public"],
      geographicScope: GeographicScope.NATIONAL,
      constraints: [],
      teamPreference: TeamPreference.SMALL_TEAM,
      minTeamSize: 2,
      maxTeamSize: 4,
      estimatedDurationWeeks: 12,
      status: ProblemStatus.PUBLISHED,
      visibility: "PUBLIC",
      posterId: primaryPosterId,
      posterRole: UserRole.INDUSTRY,
      organizationName: p.organizationName,
      verificationStatus: VerificationStatus.VERIFIED,
      createdAt: now - 1000 * 60 * 60 * 24 * 30,
      updatedAt: now
    };
    await problemsRef.doc(prob.id).set(prob, { merge: true });
  }
  
  console.log("✅ Seeded problems");

  // 4. Create Applications
  const appsRef = adminDb.collection('applications');
  const student1Id = userUIDs["student.demo@synergybridge.local"];
  const student2Id = userUIDs["student2.demo@synergybridge.local"];
  const mentorId = userUIDs["mentor.demo@synergybridge.local"];
  
  const applicationsList: Application[] = [
    {
      id: "demo_app_1",
      problemId: "demo_prob_1",
      applicantId: student1Id,
      proposal: "Developing CropGuard AI: An edge-deployable deep learning mobile model for crop stress and disease diagnosis.",
      motivation: "Passionate about combining edge neural networks and local agriculture solutions.",
      status: ApplicationStatus.ACCEPTED,
      createdAt: now - 1000 * 60 * 60 * 24 * 22,
      updatedAt: now - 1000 * 60 * 60 * 24 * 20
    },
    {
      id: "demo_app_2",
      problemId: "demo_prob_2",
      applicantId: student1Id,
      proposal: "AquaSense: IoT-driven anomaly detection and sensor network for urban and agricultural water conservation.",
      motivation: "Solving critical water wastage through edge IoT analytics.",
      status: ApplicationStatus.ACCEPTED,
      createdAt: now - 1000 * 60 * 60 * 24 * 20,
      updatedAt: now - 1000 * 60 * 60 * 24 * 18
    },
    {
      id: "demo_app_3",
      problemId: "demo_prob_3",
      applicantId: student1Id,
      proposal: "MediRoute: Intelligent triage queuing and predictive resource allocation for rural community clinics.",
      motivation: "Improving healthcare access and clinic efficiency.",
      status: ApplicationStatus.ACCEPTED,
      createdAt: now - 1000 * 60 * 60 * 24 * 18,
      updatedAt: now - 1000 * 60 * 60 * 24 * 16
    },
    {
      id: "demo_app_4",
      problemId: "demo_prob_4",
      applicantId: student1Id,
      proposal: "EduBridge: Knowledge-graph powered adaptive learning platform for technical skills development.",
      motivation: "Democratizing higher education and specialized technical learning paths.",
      status: ApplicationStatus.ACCEPTED,
      createdAt: now - 1000 * 60 * 60 * 24 * 15,
      updatedAt: now - 1000 * 60 * 60 * 24 * 14
    },
    {
      id: "demo_app_5",
      problemId: "demo_prob_4",
      applicantId: student2Id,
      proposal: "SolarTrack: AI-enhanced IoT telemetry system for distributed photovoltaic microgrids.",
      motivation: "Accelerating renewable clean energy reliability.",
      status: ApplicationStatus.ACCEPTED,
      createdAt: now - 1000 * 60 * 60 * 24 * 14,
      updatedAt: now - 1000 * 60 * 60 * 24 * 12
    },
    {
      id: "demo_app_6",
      problemId: "demo_prob_2",
      applicantId: student1Id,
      proposal: "SafeTransit: Real-time computer vision and mobility stream safety analysis for public transit.",
      motivation: "Enhancing commuter safety through predictive AI.",
      status: ApplicationStatus.ACCEPTED,
      createdAt: now - 1000 * 60 * 60 * 24 * 12,
      updatedAt: now - 1000 * 60 * 60 * 24 * 10
    },
    {
      id: "demo_app_7",
      problemId: "demo_prob_6",
      applicantId: student1Id,
      proposal: "WasteWise: Computer vision waste sorting and collection fleet route optimization.",
      motivation: "Driving circular economy practices in municipal waste management.",
      status: ApplicationStatus.ACCEPTED,
      createdAt: now - 1000 * 60 * 60 * 24 * 35,
      updatedAt: now - 1000 * 60 * 60 * 24 * 30
    },
    {
      id: "demo_app_8",
      problemId: "demo_prob_3",
      applicantId: student2Id,
      proposal: "SkillMatch: Semantic embedding talent-to-project matching platform for student innovators.",
      motivation: "Connecting university students to interdisciplinary technical challenges.",
      status: ApplicationStatus.ACCEPTED,
      createdAt: now - 1000 * 60 * 60 * 24 * 30,
      updatedAt: now - 1000 * 60 * 60 * 24 * 25
    }
  ];

  for (const app of applicationsList) {
    await appsRef.doc(app.id).set(app, { merge: true });
  }

  // 5. Create 8 Synthetic Demo Projects
  const projectsRef = adminDb.collection('projects');

  const projectsList: Project[] = [
    {
      id: "demo_proj_1",
      problemId: "demo_prob_1",
      applicationId: "demo_app_1",
      studentIds: [student1Id, student2Id],
      mentorId: mentorId,
      title: "CropGuard AI",
      description: "AI-assisted crop monitoring that helps identify crop stress and potential disease using image-based analysis.",
      category: "Agriculture & AI",
      domain: "Agriculture",
      keyObjective: "Develop an edge-deployable deep learning model with >90% precision for early blight and rust detection, integrated with a local language mobile advisory dashboard for farmers.",
      status: ProjectStatus.IN_PROGRESS,
      progress: 45,
      startDate: now - 1000 * 60 * 60 * 24 * 20,
      targetCompletionDate: now + 1000 * 60 * 60 * 24 * 45,
      createdAt: now - 1000 * 60 * 60 * 24 * 20,
      updatedAt: now
    },
    {
      id: "demo_proj_2",
      problemId: "demo_prob_2",
      applicationId: "demo_app_2",
      studentIds: [student1Id, student2Id, "synthetic_student_1"],
      mentorId: mentorId,
      title: "AquaSense",
      description: "An IoT-based water monitoring platform designed to detect abnormal consumption and reduce water waste.",
      category: "Sustainability & IoT",
      domain: "Sustainability",
      keyObjective: "Deploy smart flow meters and anomaly detection algorithms to identify underground pipeline leaks in real-time.",
      status: ProjectStatus.IN_PROGRESS,
      progress: 60,
      startDate: now - 1000 * 60 * 60 * 24 * 18,
      targetCompletionDate: now + 1000 * 60 * 60 * 24 * 40,
      createdAt: now - 1000 * 60 * 60 * 24 * 18,
      updatedAt: now - 1000 * 60 * 60 * 24 * 1
    },
    {
      id: "demo_proj_3",
      problemId: "demo_prob_3",
      applicationId: "demo_app_3",
      studentIds: [student1Id, "synthetic_student_2"],
      mentorId: mentorId,
      title: "MediRoute",
      description: "A smart appointment and patient-routing platform designed to reduce waiting times in community clinics.",
      category: "Healthcare Technology",
      domain: "Healthcare",
      keyObjective: "Streamline patient triage and appointment slot allocations through predictive patient load scheduling.",
      status: ProjectStatus.IN_PROGRESS,
      progress: 35,
      startDate: now - 1000 * 60 * 60 * 24 * 15,
      targetCompletionDate: now + 1000 * 60 * 60 * 24 * 60,
      createdAt: now - 1000 * 60 * 60 * 24 * 15,
      updatedAt: now - 1000 * 60 * 60 * 24 * 2
    },
    {
      id: "demo_proj_4",
      problemId: "demo_prob_4",
      applicationId: "demo_app_4",
      studentIds: [student1Id, "synthetic_student_3"],
      mentorId: mentorId,
      title: "EduBridge",
      description: "An adaptive learning platform that helps students identify knowledge gaps and access personalized learning resources.",
      category: "Education Technology",
      domain: "Education",
      keyObjective: "Build knowledge-graph driven adaptive learning paths tailored to engineering student skill requirements.",
      status: ProjectStatus.ALLOCATED,
      progress: 20,
      startDate: now - 1000 * 60 * 60 * 24 * 10,
      targetCompletionDate: now + 1000 * 60 * 60 * 24 * 80,
      createdAt: now - 1000 * 60 * 60 * 24 * 10,
      updatedAt: now - 1000 * 60 * 60 * 24 * 3
    },
    {
      id: "demo_proj_5",
      problemId: "demo_prob_4",
      applicationId: "demo_app_5",
      studentIds: [student2Id, "synthetic_student_4"],
      mentorId: mentorId,
      title: "SolarTrack",
      description: "A solar monitoring solution that tracks energy generation, equipment performance, and maintenance requirements.",
      category: "Clean Energy",
      domain: "Clean Energy",
      keyObjective: "Optimize solar photovoltaic array output and forecast equipment degradation using IoT telemetry.",
      status: ProjectStatus.IN_PROGRESS,
      progress: 50,
      startDate: now - 1000 * 60 * 60 * 24 * 12,
      targetCompletionDate: now + 1000 * 60 * 60 * 24 * 50,
      createdAt: now - 1000 * 60 * 60 * 24 * 12,
      updatedAt: now - 1000 * 60 * 60 * 24 * 2
    },
    {
      id: "demo_proj_6",
      problemId: "demo_prob_2",
      applicationId: "demo_app_6",
      studentIds: [student1Id, student2Id, "synthetic_student_5"],
      mentorId: mentorId,
      title: "SafeTransit",
      description: "A predictive transit safety platform that identifies potentially hazardous traffic conditions using aggregated mobility data.",
      category: "Mobility & AI",
      domain: "Mobility",
      keyObjective: "Implement computer vision accident hazard prediction algorithms on urban traffic camera streams.",
      status: ProjectStatus.IN_PROGRESS,
      progress: 70,
      startDate: now - 1000 * 60 * 60 * 24 * 14,
      targetCompletionDate: now + 1000 * 60 * 60 * 24 * 30,
      createdAt: now - 1000 * 60 * 60 * 24 * 14,
      updatedAt: now - 1000 * 60 * 60 * 24 * 1
    },
    {
      id: "demo_proj_7",
      problemId: "demo_prob_6",
      applicationId: "demo_app_7",
      studentIds: [student1Id, "synthetic_student_6"],
      mentorId: mentorId,
      title: "WasteWise",
      description: "A waste classification and collection optimization system designed to improve recycling efficiency.",
      category: "Sustainability",
      domain: "Sustainability",
      keyObjective: "Automate municipal solid waste sorting using optical sensors and route optimization for collection vehicles.",
      status: ProjectStatus.COMPLETED,
      progress: 100,
      startDate: now - 1000 * 60 * 60 * 24 * 60,
      targetCompletionDate: now - 1000 * 60 * 60 * 24 * 5,
      createdAt: now - 1000 * 60 * 60 * 24 * 60,
      updatedAt: now - 1000 * 60 * 60 * 24 * 5
    },
    {
      id: "demo_proj_8",
      problemId: "demo_prob_3",
      applicationId: "demo_app_8",
      studentIds: [student1Id, student2Id],
      mentorId: mentorId,
      title: "SkillMatch",
      description: "A skills-based platform connecting learners with suitable projects, mentors, and practical opportunities.",
      category: "Career Technology",
      domain: "Career Tech",
      keyObjective: "Match multi-disciplinary student teams to complex engineering problem statements using semantic embeddings.",
      status: ProjectStatus.COMPLETED,
      progress: 100,
      startDate: now - 1000 * 60 * 60 * 24 * 45,
      targetCompletionDate: now - 1000 * 60 * 60 * 24 * 2,
      createdAt: now - 1000 * 60 * 60 * 24 * 45,
      updatedAt: now - 1000 * 60 * 60 * 24 * 2
    }
  ];

  for (const proj of projectsList) {
    await projectsRef.doc(proj.id).set(proj, { merge: true });
  }

  const proj1 = projectsList[0];

  // 6. Seed Tasks for CropGuard AI
  const tasksList: Task[] = [
    {
      id: "cg_task_1",
      projectId: proj1.id,
      title: "Define crop disease dataset",
      description: "Catalogued 4,200 labeled field images covering tomato and potato leaf blights with localized labels.",
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      createdBy: student1Id,
      createdAt: now - 1000 * 60 * 60 * 24 * 15,
      updatedAt: now - 1000 * 60 * 60 * 24 * 10,
      completedAt: now - 1000 * 60 * 60 * 24 * 10,
    },
    {
      id: "cg_task_2",
      projectId: proj1.id,
      title: "Prepare image preprocessing pipeline",
      description: "Built augmentations, histogram normalization, and TFRecord conversion scripts for mobile input.",
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      createdBy: student1Id,
      createdAt: now - 1000 * 60 * 60 * 24 * 12,
      updatedAt: now - 1000 * 60 * 60 * 24 * 7,
      completedAt: now - 1000 * 60 * 60 * 24 * 7,
    },
    {
      id: "cg_task_3",
      projectId: proj1.id,
      title: "Train baseline classification model",
      description: "Benchmarking MobileNetV3 and EfficientNet-B0 architectures for edge inference accuracy.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      createdBy: student1Id,
      createdAt: now - 1000 * 60 * 60 * 24 * 6,
      updatedAt: now - 1000 * 60 * 60 * 24 * 1,
    },
    {
      id: "cg_task_4",
      projectId: proj1.id,
      title: "Build farmer dashboard",
      description: "Designing simple high-contrast diagnosis screen with multilingual voice prompts and treatment cards.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      createdBy: student2Id,
      createdAt: now - 1000 * 60 * 60 * 24 * 5,
      updatedAt: now - 1000 * 60 * 60 * 24 * 2,
    },
    {
      id: "cg_task_5",
      projectId: proj1.id,
      title: "Integrate model inference API",
      description: "Export ONNX models and set up quantized microservice endpoints with sub-150ms response latency.",
      status: TaskStatus.REVIEW,
      priority: TaskPriority.HIGH,
      createdBy: student1Id,
      createdAt: now - 1000 * 60 * 60 * 24 * 4,
      updatedAt: now - 1000 * 60 * 60 * 24 * 1,
    },
    {
      id: "cg_task_6",
      projectId: proj1.id,
      title: "Conduct field validation",
      description: "Test diagnosis accuracy directly on live farm crops across 3 regional test partner plots.",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      createdBy: student2Id,
      createdAt: now - 1000 * 60 * 60 * 24 * 3,
      updatedAt: now - 1000 * 60 * 60 * 24 * 3,
    },
    {
      id: "cg_task_7",
      projectId: proj1.id,
      title: "Prepare final project report",
      description: "Compile empirical evaluation matrices, user feedback logs, and deployment documentation.",
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      createdBy: student1Id,
      createdAt: now - 1000 * 60 * 60 * 24 * 2,
      updatedAt: now - 1000 * 60 * 60 * 24 * 2,
    },
  ];

  for (const t of tasksList) {
    await adminDb.collection('tasks').doc(t.id).set(t, { merge: true });
    await projectsRef.doc(proj1.id).collection('tasks').doc(t.id).set(t, { merge: true });
  }

  // 7. Seed Milestones for CropGuard AI
  const milestonesList: Milestone[] = [
    {
      id: "cg_mile_1",
      projectId: proj1.id,
      title: "1. Problem Definition",
      description: "Scoped farmer challenges in rural agricultural clusters, confirmed dataset criteria, and aligned with domain mentor Dr. Mehta.",
      targetDate: now - 1000 * 60 * 60 * 24 * 15,
      status: MilestoneStatus.COMPLETED,
      completionPercentage: 100,
      createdBy: student1Id,
      completedAt: now - 1000 * 60 * 60 * 24 * 15,
      createdAt: now - 1000 * 60 * 60 * 24 * 20,
      updatedAt: now - 1000 * 60 * 60 * 24 * 15,
    },
    {
      id: "cg_mile_2",
      projectId: proj1.id,
      title: "2. Dataset Preparation",
      description: "Collected, annotated, and verified 4,200 multi-spectral crop leaf images across 8 disease classes.",
      targetDate: now - 1000 * 60 * 60 * 24 * 7,
      status: MilestoneStatus.COMPLETED,
      completionPercentage: 100,
      createdBy: student1Id,
      completedAt: now - 1000 * 60 * 60 * 24 * 7,
      createdAt: now - 1000 * 60 * 60 * 24 * 15,
      updatedAt: now - 1000 * 60 * 60 * 24 * 7,
    },
    {
      id: "cg_mile_3",
      projectId: proj1.id,
      title: "3. ML Baseline",
      description: "Train initial convolutional baseline models (MobileNet/ResNet) and optimize F1-score for low-resolution mobile field camera images.",
      targetDate: now + 1000 * 60 * 60 * 24 * 10,
      status: MilestoneStatus.IN_PROGRESS,
      completionPercentage: 60,
      createdBy: student1Id,
      createdAt: now - 1000 * 60 * 60 * 24 * 7,
      updatedAt: now - 1000 * 60 * 60 * 24 * 1,
    },
    {
      id: "cg_mile_4",
      projectId: proj1.id,
      title: "4. Application Integration",
      description: "Build multilingual mobile dashboard with voice assistant support and automated real-time disease treatment recommendations.",
      targetDate: now + 1000 * 60 * 60 * 24 * 25,
      status: MilestoneStatus.NOT_STARTED,
      completionPercentage: 0,
      createdBy: student1Id,
      createdAt: now - 1000 * 60 * 60 * 24 * 7,
      updatedAt: now - 1000 * 60 * 60 * 24 * 7,
    },
    {
      id: "cg_mile_5",
      projectId: proj1.id,
      title: "5. Field Validation",
      description: "Deploy prototype test kits to 20 local smallholder farmers and evaluate diagnostic precision in real farm conditions.",
      targetDate: now + 1000 * 60 * 60 * 24 * 38,
      status: MilestoneStatus.NOT_STARTED,
      completionPercentage: 0,
      createdBy: student1Id,
      createdAt: now - 1000 * 60 * 60 * 24 * 7,
      updatedAt: now - 1000 * 60 * 60 * 24 * 7,
    },
    {
      id: "cg_mile_6",
      projectId: proj1.id,
      title: "6. Final Demonstration",
      description: "Present live demonstration, submit production codebase repository, and publish final impact evaluation report for certification.",
      targetDate: now + 1000 * 60 * 60 * 24 * 45,
      status: MilestoneStatus.NOT_STARTED,
      completionPercentage: 0,
      createdBy: student1Id,
      createdAt: now - 1000 * 60 * 60 * 24 * 7,
      updatedAt: now - 1000 * 60 * 60 * 24 * 7,
    },
  ];

  for (const m of milestonesList) {
    await adminDb.collection('milestones').doc(m.id).set(m, { merge: true });
    await projectsRef.doc(proj1.id).collection('milestones').doc(m.id).set(m, { merge: true });
  }

  // 8. Seed Chat Messages for CropGuard AI
  const messagesList: ProjectMessage[] = [
    {
      id: "cg_msg_1",
      projectId: proj1.id,
      senderId: student1Id,
      senderName: "Aarav Sharma",
      message: "We've completed the initial crop disease dataset preparation.",
      createdAt: now - 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 45,
    },
    {
      id: "cg_msg_2",
      projectId: proj1.id,
      senderId: mentorId,
      senderName: "Dr. Rahul Mehta",
      message: "Great. Before training the baseline model, verify that the classes are reasonably balanced.",
      createdAt: now - 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 30,
    },
    {
      id: "cg_msg_3",
      projectId: proj1.id,
      senderId: student1Id,
      senderName: "Aarav Sharma",
      message: "We'll run the class distribution analysis today.",
      createdAt: now - 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 15,
    },
    {
      id: "cg_msg_4",
      projectId: proj1.id,
      senderId: mentorId,
      senderName: "Dr. Rahul Mehta",
      message: "Perfect. Share the results here before moving to model evaluation.",
      createdAt: now - 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 5,
    },
  ];

  for (const msg of messagesList) {
    await adminDb.collection('projectMessages').doc(msg.id).set(msg, { merge: true });
  }

  // 9. Seed Files for CropGuard AI
  const filesList: ProjectFile[] = [
    {
      id: "cg_file_1",
      projectId: proj1.id,
      uploadedBy: student1Id,
      fileName: "CropGuard_Project_Proposal.pdf",
      contentType: "application/pdf",
      size: 2450000,
      storagePath: `projects/${proj1.id}/CropGuard_Project_Proposal.pdf`,
      category: FileCategory.DOCUMENT,
      createdAt: now - 1000 * 60 * 60 * 24 * 15,
    },
    {
      id: "cg_file_2",
      projectId: proj1.id,
      uploadedBy: student1Id,
      fileName: "Disease_Dataset_Summary.xlsx",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 1120000,
      storagePath: `projects/${proj1.id}/Disease_Dataset_Summary.xlsx`,
      category: FileCategory.REPORT,
      createdAt: now - 1000 * 60 * 60 * 24 * 10,
    },
    {
      id: "cg_file_3",
      projectId: proj1.id,
      uploadedBy: student2Id,
      fileName: "Model_Architecture.png",
      contentType: "image/png",
      size: 870000,
      storagePath: `projects/${proj1.id}/Model_Architecture.png`,
      category: FileCategory.IMAGE,
      createdAt: now - 1000 * 60 * 60 * 24 * 7,
    },
    {
      id: "cg_file_4",
      projectId: proj1.id,
      uploadedBy: student1Id,
      fileName: "Baseline_Model_Report.pdf",
      contentType: "application/pdf",
      size: 3680000,
      storagePath: `projects/${proj1.id}/Baseline_Model_Report.pdf`,
      category: FileCategory.REPORT,
      createdAt: now - 1000 * 60 * 60 * 24 * 3,
    },
    {
      id: "cg_file_5",
      projectId: proj1.id,
      uploadedBy: student2Id,
      fileName: "Field_Test_Plan.docx",
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 640000,
      storagePath: `projects/${proj1.id}/Field_Test_Plan.docx`,
      category: FileCategory.DOCUMENT,
      createdAt: now - 1000 * 60 * 60 * 24 * 1,
    },
  ];

  for (const f of filesList) {
    await adminDb.collection('projectFiles').doc(f.id).set(f, { merge: true });
  }

  // 10. Seed Activities for CropGuard AI
  const activitiesList: ProjectActivity[] = [
    {
      id: "cg_act_1",
      projectId: proj1.id,
      actorId: student1Id,
      actorName: "Aarav Sharma",
      action: "TASK_UPDATED" as any,
      entityType: "TASK",
      entityId: "cg_task_3",
      metadata: { title: "Train baseline classification model", status: "IN_PROGRESS" },
      createdAt: now - 1000 * 60 * 60 * 6,
    },
    {
      id: "cg_act_2",
      projectId: proj1.id,
      actorId: mentorId,
      actorName: "Dr. Rahul Mehta",
      action: "CHAT_MESSAGE" as any,
      entityType: "MESSAGE",
      metadata: { textPreview: "Great. Before training the baseline model..." },
      createdAt: now - 1000 * 60 * 60 * 24 * 2,
    },
    {
      id: "cg_act_3",
      projectId: proj1.id,
      actorId: student1Id,
      actorName: "Aarav Sharma",
      action: "MILESTONE_COMPLETED" as any,
      entityType: "MILESTONE",
      entityId: "cg_mile_2",
      metadata: { title: "2. Dataset Preparation" },
      createdAt: now - 1000 * 60 * 60 * 24 * 7,
    },
    {
      id: "cg_act_4",
      projectId: proj1.id,
      actorId: student2Id,
      actorName: "Ananya Patil",
      action: "FILE_UPLOADED" as any,
      entityType: "FILE",
      metadata: { fileName: "Disease_Dataset_Summary.xlsx" },
      createdAt: now - 1000 * 60 * 60 * 24 * 10,
    },
    {
      id: "cg_act_5",
      projectId: proj1.id,
      actorId: student1Id,
      actorName: "Aarav Sharma",
      action: "MILESTONE_COMPLETED" as any,
      entityType: "MILESTONE",
      entityId: "cg_mile_1",
      metadata: { title: "1. Problem Definition" },
      createdAt: now - 1000 * 60 * 60 * 24 * 15,
    },
    {
      id: "cg_act_6",
      projectId: proj1.id,
      actorId: userUIDs["institution.demo@synergybridge.local"],
      actorName: "Prof. Vikram Joshi",
      action: "MENTOR_ASSIGNED" as any,
      entityType: "PROJECT",
      metadata: { mentorId: "Dr. Rahul Mehta" },
      createdAt: now - 1000 * 60 * 60 * 24 * 18,
    },
    {
      id: "cg_act_7",
      projectId: proj1.id,
      actorId: student1Id,
      actorName: "Aarav Sharma",
      action: "PROJECT_CREATED" as any,
      entityType: "PROJECT",
      metadata: { title: "CropGuard AI" },
      createdAt: now - 1000 * 60 * 60 * 24 * 20,
    },
  ];

  for (const act of activitiesList) {
    await adminDb.collection('projectActivities').doc(act.id).set(act, { merge: true });
  }

  // 11. Seed Originality Report & Funding Grant for CropGuard AI
  await adminDb.collection("originalityReports").doc("cg_orig_1").set({
    id: "cg_orig_1",
    projectId: proj1.id,
    version: 1,
    score: 95,
    passed: true,
    flags: [],
    analysisMetadata: "Automated institutional evaluation verified unique dataset collection methodology and novel edge convolutional architecture.",
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString()
  }, { merge: true });

  const grant1: FundingGrant = {
    id: "cg_grant_1",
    projectId: proj1.id,
    requestedAmount: 50000,
    approvedAmount: 40000,
    disbursedAmount: 20000,
    currency: "INR",
    tier: "SEED",
    source: "SynergyBridge AgriTech Innovation Grant",
    status: FundingStatus.APPROVED,
    originalityScore: 95,
    projectQualityScore: 92,
    milestones: [
      {
        id: "fm_1",
        title: "Cloud/API Infrastructure",
        amount: 12000,
        status: "RELEASED",
        releasedAt: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
      },
      {
        id: "fm_2",
        title: "Dataset & Annotation Tooling",
        amount: 8000,
        status: "RELEASED",
        releasedAt: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
      },
      {
        id: "fm_3",
        title: "Field Testing & Regional Partner Trials",
        amount: 15000,
        status: "PENDING",
        dueDate: new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString(),
      },
      {
        id: "fm_4",
        title: "Hardware / Mobile Test Equipment",
        amount: 5000,
        status: "PENDING",
        dueDate: new Date(now + 1000 * 60 * 60 * 24 * 40).toISOString(),
      },
    ],
    requestedBy: student1Id,
    reviewedBy: "reviewer.demo@synergybridge.local",
    reviewedAt: new Date(now - 1000 * 60 * 60 * 24 * 12).toISOString(),
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 15).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await adminDb.collection("fundingGrants").doc(grant1.id).set(grant1, { merge: true });

  // 12. Seed Demo Certificate for CropGuard AI
  const cert1: Certificate = {
    id: "cert_wastewise_demo_1",
    verificationId: "DEMO-CERT-002",
    projectId: projectsList[6].id,
    applicationId: projectsList[6].applicationId,
    problemId: projectsList[6].problemId,
    studentId: student1Id,
    studentName: "Aarav Sharma",
    projectTitle: "WasteWise Completed",
    problemTitle: "Urban Waste Collection Optimization",
    institution: "SynergyBridge Demo University",
    issuedAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
    status: CertificateStatus.ISSUED,
    certificateHash: "demo-hash-12345",
    blockchainStatus: BlockchainStatus.MOCK,
    blockchainTransactionId: "mock-tx-5678",
    digiLockerStatus: ExternalCredentialStatus.NOT_REQUESTED,
    abcStatus: ExternalCredentialStatus.NOT_REQUESTED,
    originalityScore: 95,
    originalityReportId: "cg_orig_1",
    issuerId: "system-seed",
    issuerName: "SynergyBridge System",
    eligibilitySnapshot: {
      taskCompletionPercentage: 100,
      completedMilestones: true,
      originalityScore: 95,
      eligibilityCheckedAt: new Date(now - 1000 * 60 * 60 * 24 * 6).toISOString(),
    },
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 6).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await adminDb.collection("certificates").doc(cert1.id).set(cert1, { merge: true });

  console.log("✅ Seeded CropGuard AI tasks, milestones, messages, files, activities, funding, originality & certificate");
  console.log("🎉 Production demo dataset seeding complete.");
}

seedProductionDemo().catch(console.error);
