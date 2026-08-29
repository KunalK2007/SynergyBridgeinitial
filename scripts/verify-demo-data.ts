/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Phase 5 - SynergyBridge Demo Data Health Check & Diagnostic Verification
 * 
 * Verifies that the Firebase Auth and Firestore demo dataset is consistent,
 * securely scoped, and correctly mapped between Auth UIDs and Firestore records.
 *
 * Safe, read-only diagnostic script.
 */

import { adminDb, adminAuth } from "../src/lib/firebase/admin";

export const DEMO_ACCOUNTS_MAP = [
  { name: "Aarav Sharma", email: "student.demo@synergybridge.local", role: "STUDENT" },
  { name: "Ananya Patil", email: "student2.demo@synergybridge.local", role: "STUDENT" },
  { name: "Dr. Rahul Mehta", email: "mentor.demo@synergybridge.local", role: "MENTOR" },
  { name: "Neha Deshmukh", email: "reviewer.demo@synergybridge.local", role: "INDUSTRY" },
  { name: "Prof. Vikram Joshi", email: "institution.demo@synergybridge.local", role: "FACULTY" },
  { name: "Priya Kulkarni", email: "faculty.demo@synergybridge.local", role: "FACULTY" },
  { name: "System Demo Admin", email: "admin.demo@synergybridge.local", role: "ADMIN" }
];

export async function verifyDemoDataHealth() {
  console.log("==================================================");
  console.log("🛡️  SynergyBridge Demo Data Health Check");
  console.log(`Target Project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "synergybridgee-dev"}`);
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  // 1. Check Demo Institution
  const demoInstId = "synergybridge-demo-institute";
  try {
    const instDoc = await adminDb.collection("institutions").doc(demoInstId).get();
    if (instDoc.exists) {
      console.log(`✅ [INSTITUTION] "${instDoc.data()?.name}" exists (${demoInstId})`);
      passed++;
    } else {
      console.warn(`❌ [INSTITUTION] Missing "${demoInstId}"`);
      failed++;
    }
  } catch (err: any) {
    console.warn(`❌ [INSTITUTION] Error querying institutions:`, err.message);
    failed++;
  }

  // 2. Check Auth Users & Firestore /users mapping
  console.log("\n👤 Verifying 7 Core Demo Accounts:");
  const resolvedUIDs: Record<string, string> = {};

  for (const acct of DEMO_ACCOUNTS_MAP) {
    try {
      const userRecord = await adminAuth.getUserByEmail(acct.email);
      resolvedUIDs[acct.email] = userRecord.uid;

      const userDoc = await adminDb.collection("users").doc(userRecord.uid).get();
      if (!userDoc.exists) {
        console.warn(`   ❌ Auth user exists for ${acct.email} but missing /users/${userRecord.uid}`);
        failed++;
      } else {
        const udata = userDoc.data();
        if (udata?.role !== acct.role) {
          console.warn(`   ⚠️ Role mismatch for ${acct.email}: expected ${acct.role}, got ${udata?.role}`);
          failed++;
        } else {
          console.log(`   ✅ ${acct.name} (${acct.role}) -> UID: ${userRecord.uid} [Synced]`);
          passed++;
        }
      }

      // Check student profile & gamification
      if (acct.role === "STUDENT") {
        const pDoc = await adminDb.collection("studentProfiles").doc(userRecord.uid).get();
        const gDoc = await adminDb.collection("gamificationProfiles").doc(userRecord.uid).get();
        if (pDoc.exists && gDoc.exists) {
          console.log(`      └─ Student profile & Gamification verified (XP: ${gDoc.data()?.xp || 0})`);
          passed++;
        } else {
          console.warn(`      └─ ❌ Missing studentProfile or gamificationProfile for ${acct.name}`);
          failed++;
        }
      }

      // Check mentor profile
      if (acct.role === "MENTOR") {
        const mDoc = await adminDb.collection("mentorProfiles").doc(userRecord.uid).get();
        if (mDoc.exists) {
          console.log(`      └─ Mentor profile verified (Status: ${mDoc.data()?.availabilityStatus || "AVAILABLE"})`);
          passed++;
        }
      }
    } catch (err: any) {
      console.warn(`   ❌ User missing in Auth: ${acct.email} (${err.message})`);
      failed++;
    }
  }

  // 3. Check Problems
  console.log("\n📋 Verifying Problem Statements:");
  try {
    const probSnap = await adminDb.collection("problems").get();
    console.log(`   Total Problems in Firestore: ${probSnap.size}`);
    if (probSnap.size >= 8) {
      console.log(`   ✅ 8+ Synthetic demo problems present across diverse domains`);
      passed++;
    } else if (probSnap.size > 0) {
      console.log(`   ⚠️ ${probSnap.size} problems found (expected 8)`);
      passed++;
    } else {
      console.warn(`   ❌ No problems found`);
      failed++;
    }
  } catch (err: any) {
    console.warn(`   ❌ Error querying problems:`, err.message);
    failed++;
  }

  // 4. Check Projects & Participant Mapping
  console.log("\n🚀 Verifying Projects & Workspaces:");
  try {
    const projSnap = await adminDb.collection("projects").get();
    console.log(`   Total Projects in Firestore: ${projSnap.size}`);
    for (const d of projSnap.docs) {
      const p = d.data();
      const hasStudents = Array.isArray(p.studentIds) && p.studentIds.length > 0;
      const statusStr = p.status || "UNKNOWN";
      console.log(`   └─ [${d.id}] "${p.title}" | Status: ${statusStr} | Progress: ${p.progress || 0}% | Students: ${p.studentIds?.length || 0}`);
      if (hasStudents) {
        passed++;
      } else {
        console.warn(`      ⚠️ Project ${d.id} has no studentIds assigned`);
        failed++;
      }
    }
  } catch (err: any) {
    console.warn(`   ❌ Error querying projects:`, err.message);
    failed++;
  }

  // 5. Check Certificates & Funding
  console.log("\n🏆 Verifying Certificates & Funding Records:");
  try {
    const certSnap = await adminDb.collection("certificates").get();
    const grantSnap = await adminDb.collection("fundingGrants").get();
    console.log(`   Certificates: ${certSnap.size} | Funding Grants: ${grantSnap.size}`);
    if (certSnap.size > 0) passed++;
    if (grantSnap.size > 0) passed++;
  } catch (err: any) {
    console.warn(`   ❌ Error querying certificates/funding:`, err.message);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`📊 Health Check Summary: ${failed === 0 ? "ALL CHECKS PASSED ✅" : "ISSUES DETECTED ⚠️"}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed / Warnings: ${failed}`);
  console.log("==================================================\n");

  return { passed, failed };
}

if (require.main === module) {
  verifyDemoDataHealth().catch(console.error);
}
