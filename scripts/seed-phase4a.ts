import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) : null;
    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      initializeApp({ projectId: 'demo-project' });
    }
  } catch (error) {
    console.log('Firebase Admin initialization skipped or failed:', error);
    if (!getApps().length) {
       initializeApp({ projectId: 'demo-project' });
    }
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
const db = adminDb;

async function seedPhase4A() {
  console.log("Seeding Phase 4A Analytics Data...");

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY && !process.env.FIRESTORE_EMULATOR_HOST) {
    console.log("No Firebase credentials found. Skipping seed execution to prevent crash.");
    return;
  }

  // Mock Institution 1 (High Participation)
  const inst1Id = "inst_analytics_1";
  
  // Create test students
  const students = [
    { uid: "student_4a_1", name: "Alice", inst: inst1Id },
    { uid: "student_4a_2", name: "Bob", inst: inst1Id },
    { uid: "student_4a_3", name: "Charlie", inst: inst1Id },
    { uid: "student_4a_4", name: "Diana", inst: inst1Id },
    { uid: "student_4a_5", name: "Eve", inst: inst1Id }, // ensures cohort of 5 for privacy bypass
  ];

  for (const s of students) {
    await db.collection("users").doc(s.uid).set({
      uid: s.uid,
      displayName: s.name,
      role: "STUDENT",
      institutionId: s.inst,
    });
    
    // Set 100% complete for the first 3
    const isComplete = ["student_4a_1", "student_4a_2", "student_4a_3"].includes(s.uid);
    await db.collection("studentProfiles").doc(s.uid).set({
      userId: s.uid,
      institutionId: s.inst,
      department: "Computer Science",
      course: "B.Tech",
      year: 3,
      semester: 6,
      interests: ["AI"],
      preferredDomains: ["HealthTech"],
      resumeUrl: isComplete ? "https://example.com/resume" : "",
      shareResumeWithApplicants: true,
      skills: isComplete ? [
        { skillId: "react", level: "ADVANCED" },
        { skillId: "node", level: "INTERMEDIATE" }
      ] : []
    });
  }

  // Mentor
  const mentorId = "mentor_4a_1";
  await db.collection("users").doc(mentorId).set({
    uid: mentorId,
    displayName: "Prof. Smith",
    role: "MENTOR",
    institutionId: inst1Id,
  });

  await db.collection("projects").doc("proj_4a_1").set({
    id: "proj_4a_1",
    title: "AI Health Monitor",
    status: "COMPLETED",
    progress: 100,
    studentIds: ["student_4a_1", "student_4a_2"],
    mentorId: mentorId,
    updatedAt: Date.now() - 1000000
  });

  await db.collection("projects").doc("proj_4a_2").set({
    id: "proj_4a_2",
    title: "Smart Traffic System",
    status: "IN_PROGRESS",
    progress: 60,
    studentIds: ["student_4a_3", "student_4a_4"],
    mentorId: mentorId,
    updatedAt: Date.now()
  });

  // Coordinator
  await db.collection("users").doc("coordinator_4a_1").set({
    uid: "coordinator_4a_1",
    displayName: "Coord",
    role: "COORDINATOR",
    institutionId: inst1Id,
  });

  console.log("Phase 4A seeding completed.");
}

seedPhase4A()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed", error);
    process.exit(1);
  });
