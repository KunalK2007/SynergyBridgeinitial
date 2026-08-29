import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, collection, writeBatch } from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

async function seedPhase3C() {
  console.log("Seeding Phase 3C test data...");
  const batch = writeBatch(db);

  // 1. Create a Mentor User
  const mentorId = "mentor-123";
  const mentorUserRef = doc(db, "users", mentorId);
  batch.set(mentorUserRef, {
    email: "mentor@test.com",
    displayName: "Dr. Mentor Smith",
    role: "MENTOR",
    accountStatus: "ACTIVE",
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  // 2. Create Mentor Profile
  const mentorProfileRef = doc(db, "mentors", mentorId);
  batch.set(mentorProfileRef, {
    userId: mentorId,
    organization: "Tech University",
    expertiseAreas: ["AI", "React", "System Design"],
    preferredDomains: ["Education", "Healthcare"],
    availabilityStatus: "AVAILABLE",
    yearsOfExperience: 10,
    maxActiveProjects: 3,
    currentProjectCount: 1,
    isAvailable: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  // 3. Create an active project (assuming problem and student exist from earlier seeds)
  const projectId = "proj-workspace-test";
  const projectRef = doc(db, "projects", projectId);
  batch.set(projectRef, {
    problemId: "problem-1", // From earlier seed
    applicationId: "app-test", 
    teamId: "team-test",
    studentIds: ["student-1"], // From earlier seed
    mentorId: mentorId,
    coordinatorId: "coordinator-1",
    title: "AI Study Assistant Implementation",
    status: "IN_PROGRESS",
    progress: 30,
    startDate: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    targetCompletionDate: Date.now() + 25 * 24 * 60 * 60 * 1000, // 25 days from now
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  // 4. Create initial tasks
  const tasksRef = collection(db, "tasks");
  batch.set(doc(tasksRef, "task-1"), {
    projectId: projectId,
    title: "Setup Firebase Authentication",
    description: "Implement login flows.",
    status: "DONE",
    priority: "HIGH",
    createdBy: mentorId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    completedAt: Date.now()
  });
  batch.set(doc(tasksRef, "task-2"), {
    projectId: projectId,
    title: "Design Database Schema",
    description: "Map out collections for Phase 3C.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    createdBy: "student-1",
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  batch.set(doc(tasksRef, "task-3"), {
    projectId: projectId,
    title: "Implement UI Dashboard",
    status: "TODO",
    priority: "LOW",
    createdBy: mentorId,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  // 5. Create Milestones
  const milestonesRef = collection(db, "milestones");
  batch.set(doc(milestonesRef, "ms-1"), {
    projectId: projectId,
    title: "Project Foundation Complete",
    description: "Auth and Database are ready.",
    targetDate: Date.now() + 2 * 24 * 60 * 60 * 1000,
    status: "IN_PROGRESS",
    completionPercentage: 50,
    createdBy: mentorId,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  // 6. Create some chat messages
  const msgRef = collection(db, "projectMessages");
  batch.set(doc(msgRef, "msg-1"), {
    projectId: projectId,
    senderId: mentorId,
    senderName: "Dr. Mentor Smith",
    message: "Welcome to the project! Let's get started on the foundation.",
    createdAt: Date.now() - 10000
  });

  await batch.commit();
  console.log("Phase 3C Seed complete.");
  process.exit(0);
}

seedPhase3C().catch(console.error);
