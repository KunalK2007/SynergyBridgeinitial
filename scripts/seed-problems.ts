// This script can be run with ts-node or tsx to seed your Firestore with realistic SynergyBridge demo problems.
// Example: npx tsx scripts/seed-problems.ts
// Ensure your .env.local is configured with valid Firebase credentials before running.

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load env vars from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error("Missing Firebase API Key. Please configure .env.local");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const problems = [
  {
    title: "Rural Health Screening Assistant",
    shortDescription: "An offline-first AI application for rapid preliminary health screening in rural areas.",
    problemStatement: "Primary healthcare centers in underserved areas often lack access to rapid preliminary screening tools for common conditions. Doctors are overwhelmed, and initial triage is slow, leading to long wait times and delayed treatment.",
    whyItMatters: "Improving initial triage speed by even 30% can drastically increase the number of patients treated per day, saving lives in critical scenarios.",
    expectedOutcome: "A deployable, low-bandwidth tablet application that can capture basic vitals and symptoms, providing a preliminary risk score for doctors.",
    successCriteria: [
      "Offline-first prototype capability",
      "Response time under 5 seconds on low-end hardware",
      "Support for local languages"
    ],
    domain: "Healthcare",
    problemType: "SOCIAL_IMPACT",
    difficulty: "INTERMEDIATE",
    skills: [
      { skillId: "python", name: "Python", category: "Programming", requirementType: "REQUIRED", importance: "REQUIRED", minimumLevel: "INTERMEDIATE" },
      { skillId: "machine-learning", name: "Machine Learning", category: "AI/ML", requirementType: "REQUIRED", importance: "REQUIRED", minimumLevel: "INTERMEDIATE" },
      { skillId: "flutter", name: "Flutter", category: "Development", requirementType: "PREFERRED", importance: "IMPORTANT", minimumLevel: "BEGINNER" }
    ],
    tags: ["rural", "offline-first", "health-tech", "triage"],
    sdgs: [3, 9, 10],
    targetBeneficiaries: ["Rural Patients", "Primary Care Doctors"],
    geographicScope: "NATIONAL",
    constraints: [
      { type: "CONNECTIVITY", description: "Must function with zero internet access", severity: "HIGH" },
      { type: "HARDWARE", description: "Must run on low-end Android tablets", severity: "MEDIUM" }
    ],
    teamPreference: "SMALL_TEAM",
    minTeamSize: 2,
    maxTeamSize: 4,
    estimatedDurationWeeks: 8,
    status: "PUBLISHED",
    visibility: "PUBLIC",
    posterId: "demo-poster-1",
    posterRole: "GOVERNMENT",
    organizationName: "Ministry of Rural Health",
    verificationStatus: "VERIFIED",
    funding: { fundingEnabled: true, fundingAmount: 50000, fundingCurrency: "INR" }
  },
  {
    title: "AI-Powered Crop Disease Detection",
    shortDescription: "Detect early signs of disease in local crops using drone imagery.",
    problemStatement: "Farmers lose up to 40% of their yield annually due to late detection of crop diseases. Current manual inspection methods are slow and subjective.",
    whyItMatters: "Early detection can reduce pesticide use, improve yield, and secure farmer livelihoods while protecting the environment.",
    expectedOutcome: "A computer vision model capable of identifying 5 common local crop diseases from aerial drone imagery.",
    successCriteria: [
      "Model accuracy > 90%",
      "False positive rate < 5%",
      "Processing pipeline handles 100 images per minute"
    ],
    domain: "Agriculture",
    problemType: "INDUSTRY",
    difficulty: "ADVANCED",
    skills: [
      { skillId: "computer-vision", name: "Computer Vision", category: "AI/ML", requirementType: "REQUIRED", importance: "REQUIRED", minimumLevel: "ADVANCED" },
      { skillId: "python", name: "Python", category: "Programming", requirementType: "REQUIRED", importance: "REQUIRED", minimumLevel: "ADVANCED" }
    ],
    tags: ["drones", "agriculture", "cnn", "yield-protection"],
    sdgs: [2, 12, 13],
    targetBeneficiaries: ["Farmers", "Agricultural Cooperatives"],
    geographicScope: "STATE",
    state: "Maharashtra",
    constraints: [
      { type: "DATA_AVAILABILITY", description: "Training dataset provided is only 500 images", severity: "HIGH" }
    ],
    teamPreference: "SMALL_TEAM",
    estimatedDurationWeeks: 12,
    status: "PUBLISHED",
    visibility: "PUBLIC",
    posterId: "demo-poster-2",
    posterRole: "INDUSTRY",
    organizationName: "AgriTech Innovations",
    verificationStatus: "VERIFIED",
    funding: { fundingEnabled: false }
  },
  {
    title: "Decentralized Credential Verification System",
    shortDescription: "A secure, blockchain-backed system to issue and verify academic certificates.",
    problemStatement: "Document forgery is a major issue in employment screening. Background verification takes weeks and costs employers significantly, while graduates face delays in onboarding.",
    whyItMatters: "A trustless verification system speeds up employment and prevents academic fraud.",
    expectedOutcome: "A working blockchain prototype that can issue a credential and verify it instantly via a public portal.",
    successCriteria: [
      "Zero-knowledge proof implementation",
      "Verifiable within 2 seconds",
      "Tamper-proof architecture"
    ],
    domain: "Education",
    problemType: "ACADEMIC",
    difficulty: "EXPERT",
    skills: [
      { skillId: "cryptography", name: "Cryptography", category: "Cybersecurity", requirementType: "REQUIRED", importance: "REQUIRED", minimumLevel: "ADVANCED" },
      { skillId: "typescript", name: "TypeScript", category: "Programming", requirementType: "REQUIRED", importance: "IMPORTANT", minimumLevel: "INTERMEDIATE" }
    ],
    tags: ["blockchain", "zk-proofs", "education", "security"],
    sdgs: [4, 8],
    targetBeneficiaries: ["Universities", "Employers", "Students"],
    geographicScope: "NATIONAL",
    constraints: [
      { type: "SECURITY", description: "Must pass a simulated security audit", severity: "HIGH" }
    ],
    teamPreference: "ANY",
    estimatedDurationWeeks: 16,
    status: "PUBLISHED",
    visibility: "PUBLIC",
    posterId: "demo-poster-3",
    posterRole: "FACULTY",
    organizationName: "National Institute of Technology",
    verificationStatus: "PENDING_REVIEW",
    funding: { fundingEnabled: true, fundingAmount: 25000, fundingCurrency: "INR" }
  }
];

async function seed() {
  console.log("Seeding problems...");
  let count = 0;
  
  for (const prob of problems) {
    const docRef = doc(collection(db, "problems"));
    const now = Date.now();
    await setDoc(docRef, {
      ...prob,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Created: ${prob.title}`);
    count++;
  }
  
  console.log(`Successfully seeded ${count} problems!`);
  process.exit(0);
}

seed().catch(console.error);
