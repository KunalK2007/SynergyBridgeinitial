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
    role: UserRole.INDUSTRY // Proxies REVIEWER in this architecture
  },
  {
    name: "Prof. Vikram Joshi",
    email: "institution.demo@synergybridge.local",
    password: "SBInstitution@2026!",
    role: UserRole.FACULTY // Proxies INSTITUTION_ADMIN
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
    
    // Using any for isDemo as it's an extended field
    await usersRef.doc(uid).set({ ...userData, isDemo: true }, { merge: true });

    // Profile generation
    if (account.role === UserRole.STUDENT) {
      await adminDb.collection('studentProfiles').doc(uid).set({
        userId: uid,
        institutionId: demoInstitutionId,
        department: "Computer Science",
        course: "B.Tech",
        year: 3,
        skills: [{ skillId: "js1", name: "JavaScript", category: "Programming", level: SkillLevel.ADVANCED }],
        interests: ["AI", "Web Development"],
        preferredDomains: ["Technology"],
        shareResumeWithApplicants: true
      }, { merge: true });
      
      // Init gamification profile
      await adminDb.collection("gamificationProfiles").doc(uid).set({
        userId: uid,
        xp: 1500,
        level: 5,
        lifetimeXp: 1500,
        currentStreak: 5,
        longestStreak: 12,
        totalProjectsCompleted: 2,
        totalTasksCompleted: 15,
        totalMilestonesCompleted: 4,
        totalProblemsSolved: 2,
        totalAchievements: 5,
        showOnLeaderboard: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as GamificationProfile, { merge: true });

    } else if (account.role === UserRole.MENTOR) {
      await adminDb.collection('mentorProfiles').doc(uid).set({
        userId: uid,
        expertiseAreas: ["AI", "Cloud Architecture"],
        organization: "SynergyBridge Demo Institute",
        availability: "Weekends"
      }, { merge: true });
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
    
    await adminDb.collection('studentProfiles').doc(syntheticUid).set({
      userId: syntheticUid,
      institutionId: demoInstitutionId,
      skills: [],
      interests: [],
      preferredDomains: [],
      shareResumeWithApplicants: false
    }, { merge: true });
  }

  console.log("✅ Seeded users and profiles");

  // 3. Create Problems
  const problemsRef = adminDb.collection('problems');
  const primaryPosterId = userUIDs["reviewer.demo@synergybridge.local"];
  
  const problemTitles = [
    "Smart Traffic Management", "AI Crop Disease Detection", "Cybersecurity Threat Monitoring",
    "Hospital Resource Optimization", "Smart Waste Management", "Renewable Energy Optimization",
    "Rural Education Platform", "Supply Chain Prediction"
  ];
  
  const problemIds = problemTitles.map((title, i) => `demo_prob_${i + 1}`);

  for (let i = 0; i < problemTitles.length; i++) {
    const prob: Problem = {
      id: problemIds[i],
      title: problemTitles[i],
      shortDescription: `A synthetic demo problem for ${problemTitles[i]}.`,
      problemStatement: `Develop a solution to tackle the core issues associated with ${problemTitles[i]} using modern technology.`,
      whyItMatters: "Important for demo showcasing.",
      expectedOutcome: "A working prototype.",
      successCriteria: ["Accuracy > 90%", "Latency < 200ms"],
      domain: "Technology",
      problemType: ProblemType.INDUSTRY,
      difficulty: DifficultyLevel.INTERMEDIATE,
      skills: [],
      tags: ["demo", "synthetic"],
      sdgs: [9, 11],
      targetBeneficiaries: ["Public"],
      geographicScope: GeographicScope.NATIONAL,
      constraints: [],
      teamPreference: TeamPreference.ANY,
      status: ProblemStatus.PUBLISHED,
      visibility: "PUBLIC",
      posterId: primaryPosterId,
      posterRole: UserRole.INDUSTRY,
      verificationStatus: VerificationStatus.VERIFIED,
      createdAt: now,
      updatedAt: now
    };
    await problemsRef.doc(prob.id).set(prob, { merge: true });
  }
  
  console.log("✅ Seeded problems");

  // 4. Create Applications
  const appsRef = adminDb.collection('applications');
  const student1Id = userUIDs["student.demo@synergybridge.local"];
  const student2Id = userUIDs["student2.demo@synergybridge.local"];
  
  const app1: Application = {
    id: "demo_app_1",
    problemId: problemIds[0],
    applicantId: student1Id,
    proposal: "We will build a smart traffic management system using computer vision.",
    motivation: "Highly interested in CV.",
    status: ApplicationStatus.ACCEPTED,
    createdAt: now,
    updatedAt: now
  };
  await appsRef.doc(app1.id).set(app1, { merge: true });
  
  const app2: Application = {
    id: "demo_app_2",
    problemId: problemIds[1],
    applicantId: student2Id,
    proposal: "Using CNNs to detect crop disease.",
    motivation: "Farming background.",
    status: ApplicationStatus.UNDER_REVIEW,
    createdAt: now,
    updatedAt: now
  };
  await appsRef.doc(app2.id).set(app2, { merge: true });

  console.log("✅ Seeded applications");

  // 5. Create Projects, Workspaces, Gamification, and Certificates
  const projectsRef = adminDb.collection('projects');
  const mentorId = userUIDs["mentor.demo@synergybridge.local"];

  // Active Project (Smart Traffic)
  const proj1: Project = {
    id: "demo_proj_1",
    problemId: problemIds[0],
    applicationId: "demo_app_1",
    studentIds: [student1Id],
    mentorId: mentorId,
    title: "Smart Traffic Management Implementation",
    status: ProjectStatus.IN_PROGRESS,
    progress: 50,
    startDate: now,
    createdAt: now,
    updatedAt: now
  };
  await projectsRef.doc(proj1.id).set(proj1, { merge: true });

  // Workspace: Tasks and Milestones for Proj 1
  const t1: Task = { id: "demo_task_1", projectId: proj1.id, title: "Data Collection", status: TaskStatus.DONE, priority: TaskPriority.HIGH, createdBy: student1Id, createdAt: now, updatedAt: now };
  const t2: Task = { id: "demo_task_2", projectId: proj1.id, title: "Model Training", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, createdBy: student1Id, createdAt: now, updatedAt: now };
  await projectsRef.doc(proj1.id).collection('tasks').doc(t1.id).set(t1, { merge: true });
  await projectsRef.doc(proj1.id).collection('tasks').doc(t2.id).set(t2, { merge: true });

  const m1: Milestone = { id: "demo_mile_1", projectId: proj1.id, title: "Phase 1: Data", description: "Collect dataset.", targetDate: now, status: MilestoneStatus.COMPLETED, completionPercentage: 100, createdBy: student1Id, createdAt: now, updatedAt: now };
  await projectsRef.doc(proj1.id).collection('milestones').doc(m1.id).set(m1, { merge: true });

  // Completed Project (CropGuard AI) to demonstrate Certificates & Funding
  const proj2: Project = {
    id: "demo_proj_2",
    problemId: problemIds[1],
    applicationId: "demo_app_legacy",
    studentIds: [student1Id, student2Id],
    mentorId: mentorId,
    title: "CropGuard AI Complete",
    status: ProjectStatus.COMPLETED,
    progress: 100,
    startDate: now - 86400000 * 30, // 30 days ago
    createdAt: now - 86400000 * 30,
    updatedAt: now
  };
  await projectsRef.doc(proj2.id).set(proj2, { merge: true });

  // Mock an Originality Report manually instead of via service to avoid complex mocking of AI if missing
  await adminDb.collection("originalityReports").doc("demo_orig_2").set({
    id: "demo_orig_2",
    projectId: proj2.id,
    version: 1,
    score: 95,
    passed: true,
    flags: [],
    analysisMetadata: "Simulated originality check for demo.",
    createdAt: new Date().toISOString()
  });
  
  // Directly add Funding 
  await adminDb.collection("fundingGrants").doc("demo_grant_1").set({
    id: "demo_grant_1",
    projectId: proj2.id,
    requestedAmount: 50000,
    currency: "INR",
    tier: "SEED",
    source: "SynergyBridge Micro-Funding",
    status: "DISBURSED",
    approvedAmount: 50000,
    disbursedAmount: 50000,
    originalityScore: 95,
    milestones: [
      { id: "gm_1", title: "Initial", amount: 50000, status: "RELEASED", releasedAt: new Date().toISOString() }
    ],
    requestedBy: student1Id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Certificate
  await adminDb.collection("certificates").doc("demo_cert_1").set({
    id: "demo_cert_1",
    verificationId: "DEMO-CERT-001",
    projectId: proj2.id,
    applicationId: "demo_app_legacy",
    problemId: problemIds[1],
    studentId: student1Id,
    studentName: "Aarav Sharma",
    projectTitle: "CropGuard AI Complete",
    problemTitle: "AI Crop Disease Detection",
    issuedAt: new Date().toISOString(),
    status: "ISSUED",
    certificateHash: "demo_hash_abc123",
    blockchainStatus: "NOT_REQUESTED",
    digiLockerStatus: "NOT_REQUESTED",
    abcStatus: "NOT_REQUESTED",
    originalityScore: 95,
    issuerId: primaryPosterId,
    issuerName: "Demo Issuer",
    eligibilitySnapshot: { eligible: true, reasons: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log("✅ Seeded projects, workspaces, originality, funding, certificates");

  // Create some project activity for analytics
  await adminDb.collection("projects").doc(proj1.id).collection("activity").add({
    id: "act1", projectId: proj1.id, actorId: student1Id, actorName: "Aarav", action: "TASK_COMPLETED", entityType: "TASK", entityId: "demo_task_1", createdAt: now
  });

  console.log("🎉 Production demo dataset seeding complete.");
}

seedProductionDemo().catch(console.error);
