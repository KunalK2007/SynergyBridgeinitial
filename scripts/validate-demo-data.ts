/**
 * Demo Data Validation Script
 *
 * Verifies consistency of seeded demo dataset in Firebase Auth & Firestore.
 * This is a safe, read-only audit script that does NOT mutate or delete data.
 */

import { adminDb, adminAuth } from "../src/lib/firebase/admin";

const EXPECTED_DEMO_EMAILS = [
  "student.demo@synergybridge.local",
  "student2.demo@synergybridge.local",
  "mentor.demo@synergybridge.local",
  "reviewer.demo@synergybridge.local",
  "institution.demo@synergybridge.local",
  "faculty.demo@synergybridge.local",
  "admin.demo@synergybridge.local"
];

export async function validateDemoData() {
  console.log("🔍 Starting Safe Demo Data Validation...\n");
  let errorCount = 0;
  let successCount = 0;

  // 1. Verify Demo Institution
  const demoInstId = "synergybridge-demo-institute";
  const instSnap = await adminDb.collection("institutions").doc(demoInstId).get();
  if (!instSnap.exists) {
    console.warn(`❌ [INSTITUTION] Demo institution "${demoInstId}" does not exist.`);
    errorCount++;
  } else {
    console.log(`✅ [INSTITUTION] Found demo institution: ${instSnap.data()?.name}`);
    successCount++;
  }

  // 2. Verify Demo Auth Users & User Documents
  const authUids: Record<string, string> = {};
  for (const email of EXPECTED_DEMO_EMAILS) {
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      authUids[email] = userRecord.uid;
      console.log(`✅ [AUTH] User found for ${email} (UID: ${userRecord.uid})`);
      successCount++;

      // Check Firestore /users doc
      const userDoc = await adminDb.collection("users").doc(userRecord.uid).get();
      if (!userDoc.exists) {
        console.warn(`❌ [FIRESTORE] Missing users doc for UID: ${userRecord.uid} (${email})`);
        errorCount++;
      } else {
        const udata = userDoc.data();
        if (!udata?.role) {
          console.warn(`❌ [FIRESTORE] User doc missing role: ${userRecord.uid}`);
          errorCount++;
        } else {
          console.log(`   └─ User doc verified (Role: ${udata.role}, Institution: ${udata.institutionId || "none"})`);
          successCount++;
        }
      }

      // Check Profile Docs
      if (email.includes("student")) {
        const pDoc = await adminDb.collection("studentProfiles").doc(userRecord.uid).get();
        if (pDoc.exists) {
          console.log(`   └─ studentProfile verified for ${userRecord.uid}`);
          successCount++;
        } else {
          console.warn(`   └─ ❌ studentProfile missing for ${userRecord.uid}`);
          errorCount++;
        }

        const gDoc = await adminDb.collection("gamificationProfiles").doc(userRecord.uid).get();
        if (gDoc.exists) {
          console.log(`   └─ gamificationProfile verified (XP: ${gDoc.data()?.xp}, Level: ${gDoc.data()?.level})`);
          successCount++;
        } else {
          console.warn(`   └─ ❌ gamificationProfile missing for ${userRecord.uid}`);
          errorCount++;
        }
      }
    } catch (e: unknown) {
      console.warn(`❌ [AUTH] Auth user missing for ${email}:`, (e as Error).message);
      errorCount++;
    }
  }

  // 3. Verify Problems
  const problemsSnap = await adminDb.collection("problems").get();
  console.log(`\n📋 [PROBLEMS] Found ${problemsSnap.size} problems.`);
  if (problemsSnap.size > 0) successCount++;
  else {
    console.warn(`❌ [PROBLEMS] No problems found in Firestore.`);
    errorCount++;
  }

  // 4. Verify Applications
  const appsSnap = await adminDb.collection("applications").get();
  console.log(`📋 [APPLICATIONS] Found ${appsSnap.size} applications.`);
  for (const appDoc of appsSnap.docs) {
    const app = appDoc.data();
    if (!app.problemId || !app.applicantId) {
      console.warn(`❌ [APPLICATIONS] Invalid app record ${appDoc.id} (missing problemId or applicantId)`);
      errorCount++;
    }
  }

  // 5. Verify Projects
  const projectsSnap = await adminDb.collection("projects").get();
  console.log(`📋 [PROJECTS] Found ${projectsSnap.size} projects.`);
  for (const projDoc of projectsSnap.docs) {
    const proj = projDoc.data();
    if (!Array.isArray(proj.studentIds) || proj.studentIds.length === 0) {
      console.warn(`❌ [PROJECTS] Project ${projDoc.id} has no studentIds.`);
      errorCount++;
    } else {
      console.log(`   └─ Project "${proj.title}" (${projDoc.id}): Status=${proj.status}, Students=[${proj.studentIds.join(", ")}]`);
      successCount++;
    }
  }

  // 6. Verify Certificates
  const certsSnap = await adminDb.collection("certificates").get();
  console.log(`📋 [CERTIFICATES] Found ${certsSnap.size} certificates.`);

  // 7. Summary
  console.log("\n==================================================");
  console.log(`VALIDATION RESULT: ${errorCount === 0 ? "PASSED ✅" : "WARNINGS/ERRORS DETECTED ⚠️"}`);
  console.log(`Checks Succeeded: ${successCount}`);
  console.log(`Checks Failed: ${errorCount}`);
  console.log("==================================================\n");

  return { successCount, errorCount };
}

if (require.main === module) {
  validateDemoData().catch(console.error);
}
