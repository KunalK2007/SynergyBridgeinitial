import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import { SkillLevel } from "../src/types/problem";

dotenv.config({ path: ".env.local" });

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!serviceAccount) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

const STUDENTS = [
  {
    userId: "demo-student-a",
    institutionId: "inst_iitb",
    department: "Computer Science",
    course: "B.Tech",
    year: 3,
    semester: 5,
    skills: [
      { skillId: "python", level: SkillLevel.ADVANCED },
      { skillId: "machine-learning", level: SkillLevel.ADVANCED },
      { skillId: "data-analysis", level: SkillLevel.INTERMEDIATE },
      { skillId: "react", level: SkillLevel.BEGINNER },
    ],
    interests: ["AI/ML", "Web Development"],
    preferredDomains: ["Artificial Intelligence", "Healthcare"],
    shareResumeWithApplicants: true,
    updatedAt: Date.now(),
  },
  {
    userId: "demo-student-b",
    institutionId: "inst_bits",
    department: "Electronics",
    course: "B.E.",
    year: 4,
    semester: 7,
    skills: [
      { skillId: "cpp", level: SkillLevel.EXPERT },
      { skillId: "iot", level: SkillLevel.ADVANCED },
      { skillId: "embedded-systems", level: SkillLevel.ADVANCED },
    ],
    interests: ["Hardware", "IoT"],
    preferredDomains: ["Smart Cities", "Agriculture"],
    shareResumeWithApplicants: false,
    updatedAt: Date.now(),
  }
];

async function seedStudents() {
  console.log("Seeding Demo Students...");
  for (const student of STUDENTS) {
    await db.collection("studentProfiles").doc(student.userId).set(student);
    
    // Create base user record
    await db.collection("users").doc(student.userId).set({
      uid: student.userId,
      email: `${student.userId}@example.com`,
      displayName: `Demo Student ${student.userId.split('-').pop()?.toUpperCase()}`,
      role: "STUDENT",
      accountStatus: "ACTIVE",
      profileCompleted: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    console.log(`Seeded student: ${student.userId}`);
  }
  console.log("Seeding complete.");
}

seedStudents().catch(console.error);
