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
      title: "AI Crop Disease Detection",
      domain: "Agriculture & AI",
      shortDescription: "An AI-assisted crop monitoring platform to detect disease and crop stress early.",
      problemStatement: "Smallholder farmers experience significant crop yield losses due to late or inaccurate diagnosis of fungal and bacterial leaf blights in regional farmlands.",
      whyItMatters: "Early and accessible mobile detection safeguards food security and farmer livelihood.",
      expectedOutcome: "A deployable low-latency edge AI model and farmer advisory mobile interface with >90% diagnosis accuracy.",
    },
    {
      id: "demo_prob_2",
      title: "Smart Traffic Management System",
      domain: "Smart Cities & IoT",
      shortDescription: "Optimize urban traffic signal timing dynamically using edge vision sensors.",
      problemStatement: "Urban intersections face heavy congestion and emergency vehicle delays due to rigid static signal cycles.",
      whyItMatters: "Dynamic signal coordination reduces carbon emissions and improves transit efficiency.",
      expectedOutcome: "Edge IoT vision prototype that dynamically adjusts green light timing based on real-time vehicle density.",
    },
    {
      id: "demo_prob_3",
      title: "Hospital Resource Optimization",
      domain: "Healthcare",
      shortDescription: "Predictive ICU bed allocation and medical equipment tracking.",
      problemStatement: "Emergency rooms experience severe delays when allocating specialized ICU equipment.",
      whyItMatters: "Timely ICU bed allocation directly impacts patient survival rates.",
      expectedOutcome: "Predictive scheduling system with queue optimization algorithms.",
    },
    {
      id: "demo_prob_4",
      title: "Renewable Energy Grid Balancing",
      domain: "Clean Energy",
      shortDescription: "Predict solar panel yield and automatically balance microgrid loads.",
      problemStatement: "Variable solar output creates microgrid fluctuations in rural community microgrids.",
      whyItMatters: "Stable microgrids ensure reliable clean power for rural health clinics and schools.",
      expectedOutcome: "Time-series forecasting model coupled with battery discharge automation.",
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
      difficulty: DifficultyLevel.INTERMEDIATE,
      skills: [
        { skillId: "sk_python", name: "Python", category: "Programming", minimumLevel: SkillLevel.INTERMEDIATE, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any },
        { skillId: "sk_cv", name: "Computer Vision", category: "AI/ML", minimumLevel: SkillLevel.INTERMEDIATE, importance: "REQUIRED" as any, requirementType: "REQUIRED" as any }
      ],
      tags: ["agriculture", "ai", "computer-vision", "edge-computing"],
      sdgs: [2, 9, 12],
      targetBeneficiaries: ["Smallholder farmers", "Rural agriculture cooperatives"],
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
      organizationName: "AgriTech Innovation Council",
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
  
  const app1: Application = {
    id: "demo_app_1",
    problemId: "demo_prob_1",
    applicantId: student1Id,
    proposal: "Developing CropGuard AI: An edge-deployable deep learning mobile model for crop stress and disease diagnosis.",
    motivation: "Passionate about combining edge neural networks and local agriculture solutions.",
    status: ApplicationStatus.ACCEPTED,
    createdAt: now - 1000 * 60 * 60 * 24 * 22,
    updatedAt: now - 1000 * 60 * 60 * 24 * 20
  };
  await appsRef.doc(app1.id).set(app1, { merge: true });

  // 5. Create Active Project (CropGuard AI)
  const projectsRef = adminDb.collection('projects');

  const proj1: Project = {
    id: "demo_proj_1",
    problemId: "demo_prob_1",
    applicationId: "demo_app_1",
    studentIds: [student1Id, student2Id],
    mentorId: mentorId,
    title: "CropGuard AI",
    description: "An AI-assisted crop monitoring platform that helps farmers identify crop stress and potential disease earlier using image-based analysis.",
    category: "Agriculture & AI",
    keyObjective: "Develop an edge-deployable deep learning model with >90% precision for early blight and rust detection, integrated with a local language mobile advisory dashboard for farmers.",
    status: ProjectStatus.IN_PROGRESS,
    progress: 45,
    startDate: now - 1000 * 60 * 60 * 24 * 20,
    targetCompletionDate: now + 1000 * 60 * 60 * 24 * 45,
    createdAt: now - 1000 * 60 * 60 * 24 * 20,
    updatedAt: now
  };
  await projectsRef.doc(proj1.id).set(proj1, { merge: true });

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

  console.log("✅ Seeded CropGuard AI tasks, milestones, messages, files, activities, funding & originality");
  console.log("🎉 Production demo dataset seeding complete.");
}

seedProductionDemo().catch(console.error);
