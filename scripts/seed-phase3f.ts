import { adminDb } from "../src/lib/firebase/admin";
import { CertificateStatus, BlockchainStatus, ExternalCredentialStatus } from "../src/types/certificate";
import { FundingStatus } from "../src/types/funding";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const args = process.argv.slice(2);
const MOCK_PROJECT_ID = args[0] || "demo-project-id";
const MOCK_STUDENT_ID = args[1] || "demo-student-id";

async function main() {
  console.log(`\n--- Seeding SynergyBridge Phase 3F Data (MOCK) ---`);
  
  if (!MOCK_PROJECT_ID || !MOCK_STUDENT_ID) {
    console.error("Please provide project ID and student ID.");
    return;
  }

  // 1. Mock Originality Report
  console.log("Seeding Mock Originality Report...");
  const reportId = uuidv4();
  await adminDb.collection("originalityReports").doc(reportId).set({
    id: reportId,
    projectId: MOCK_PROJECT_ID,
    version: 1,
    score: 88,
    passed: true,
    flags: ["Minor overlap in documentation (Simulated)"],
    methodologyVersion: "SYNERGYBRIDGE-ORIGINALITY-MVP-v1",
    repositoryAnalysis: {
      filesAnalyzed: 25,
      duplicateIndicators: 0,
      simulated: true,
    },
    peerReviewSignals: {
      reviewsConsidered: 1,
      originalityConcerns: 0,
    },
    assessedBy: "system-seed",
    assessedAt: new Date().toISOString(),
    status: "COMPLETED",
  });

  // 2. Mock Certificate
  console.log("Seeding Mock Certificate...");
  const certId = uuidv4();
  const verificationId = crypto.randomBytes(8).toString('hex').toUpperCase();
  
  await adminDb.collection("certificates").doc(certId).set({
    id: certId,
    verificationId,
    projectId: MOCK_PROJECT_ID,
    applicationId: "N/A",
    problemId: "demo-problem",
    studentId: MOCK_STUDENT_ID,
    studentName: "Demo Student",
    projectTitle: "AI Traffic Optimization",
    problemTitle: "Urban Mobility Solution",
    institution: "SynergyBridge Academy",
    issuedAt: new Date().toISOString(),
    status: CertificateStatus.ISSUED,
    certificateHash: "mock-hash-" + Date.now(),
    blockchainStatus: BlockchainStatus.MOCK,
    blockchainTransactionId: "mock-tx-1234",
    digiLockerStatus: ExternalCredentialStatus.NOT_REQUESTED,
    abcStatus: ExternalCredentialStatus.NOT_REQUESTED,
    originalityScore: 88,
    originalityReportId: reportId,
    issuerId: "system-seed",
    issuerName: "System Authority",
    eligibilitySnapshot: {
      taskCompletionPercentage: 100,
      completedMilestones: true,
      originalityScore: 88,
      eligibilityCheckedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 3. Mock Funding Grant
  console.log("Seeding Mock Funding Grant...");
  const grantId = uuidv4();
  await adminDb.collection("fundingGrants").doc(grantId).set({
    id: grantId,
    projectId: MOCK_PROJECT_ID,
    requestedAmount: 50000,
    approvedAmount: 50000,
    disbursedAmount: 25000,
    currency: "INR",
    tier: "GROWTH",
    source: "SynergyBridge Micro-Funding",
    status: FundingStatus.DISBURSED,
    originalityScore: 88,
    milestones: [
      {
        id: uuidv4(),
        title: "Initial Disbursal",
        amount: 25000,
        status: "RELEASED",
        releasedAt: new Date().toISOString(),
        releasedBy: "system-seed",
      },
      {
        id: uuidv4(),
        title: "Final Completion",
        amount: 25000,
        status: "PENDING",
      }
    ],
    requestedBy: MOCK_STUDENT_ID,
    reviewedBy: "system-seed",
    reviewedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log("Phase 3F Seed Complete!");
}

main().catch(console.error);
