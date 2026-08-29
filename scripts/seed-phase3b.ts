import { initializeApp } from "firebase/app";
import { Problem } from "@/types/problem";
import { getFirestore, collection, writeBatch, doc, getDocs } from "firebase/firestore";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedPhase3B() {
  console.log("Seeding Phase 3B Data...");
  const batch = writeBatch(db);

  try {
    // 1. Get existing students and problems
    const studentSnaps = await getDocs(collection(db, "studentProfiles"));
    const students = studentSnaps.docs.map(d => ({ id: d.id, ...d.data() }));

    const problemSnaps = await getDocs(collection(db, "problems"));
    const problems = problemSnaps.docs.map(d => ({ id: d.id, ...d.data() }));

    if (students.length < 2 || problems.length === 0) {
      console.log("Not enough students or problems seeded yet.");
      return;
    }

    const s1 = students[0];
    const s2 = students[1];
    const problem = problems[0]; // Assume first problem for team

    // 2. Create Team
    const teamRef = doc(collection(db, "teams"));
    batch.set(teamRef, {
      name: "Alpha Hackers",
      leaderId: s1.id,
      memberIds: [s1.id, s2.id],
      institutionIds: [],
      maxMembers: 4,
      status: "READY",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // 3. Create Applications
    // Team App
    const app1Ref = doc(collection(db, "applications"));
    batch.set(app1Ref, {
      problemId: problem.id,
      applicantId: s1.id,
      teamId: teamRef.id,
      proposal: "We propose a decentralized, scalable solution to fix the challenge by implementing a Next.js frontend with robust matching algorithms. We have tested this previously.",
      motivation: "Our team has combined expertise in React and Python and we are deeply passionate about social innovation.",
      fitScore: 85,
      synergyBridgeFitScore: 85,
      status: "UNDER_REVIEW",
      createdAt: Date.now() - 86400000, // 1 day ago
      updatedAt: Date.now()
    });

    // Individual App (ACCEPTED)
    if (problems.length > 1) {
      const p2 = problems[1] as unknown as Problem;
      const app2Ref = doc(collection(db, "applications"));
      batch.set(app2Ref, {
        problemId: p2.id,
        applicantId: s2.id,
        teamId: null,
        proposal: "I will build a hardware prototype using Arduino and Raspberry Pi. The IoT pipeline will push data securely.",
        motivation: "I have 4 years of experience with Embedded Systems and IoT.",
        fitScore: 92,
        synergyBridgeFitScore: 92,
        status: "ACCEPTED",
        createdAt: Date.now() - 172800000, // 2 days ago
        updatedAt: Date.now(),
        reviewedAt: Date.now(),
        reviewedBy: "admin-id"
      });

      // Project for ACCEPTED application
      const projRef = doc(collection(db, "projects"));
      batch.set(projRef, {
        problemId: p2.id,
        applicationId: app2Ref.id,
        teamId: null,
        studentIds: [s2.id],
        title: `Project: ${p2.title || 'Untitled'}`,
        status: "ALLOCATED",
        progress: 0,
        startDate: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    await batch.commit();
    console.log("Phase 3B Data Seeded Successfully!");

  } catch (error) {
    console.error("Error seeding Phase 3B:", error);
  }
}

seedPhase3B();
