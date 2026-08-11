import { adminDb } from "../src/lib/firebase/admin";
import { UserRole } from "../src/types/auth";
import { ProjectStatus } from "../src/types/project";
import { ApplicationStatus } from "../src/types/application";
import * as crypto from "crypto";

const DEMO_INSTITUTION_ID = "inst_demo_4b_" + crypto.randomBytes(4).toString("hex");

async function seedPhase4B() {
  console.log("Seeding Phase 4B Demo Data (Deterministic)...");
  const batch = adminDb.batch();

  // Create an Institution Coordinator
  const coordId = "coord_demo_4b";
  batch.set(adminDb.collection("users").doc(coordId), {
    role: UserRole.FACULTY,
    institutionId: DEMO_INSTITUTION_ID,
    createdAt: new Date().toISOString()
  });

  // Seed 10 Students (above MIN_ANALYTICS_COHORT_SIZE = 5)
  for (let i = 0; i < 10; i++) {
    const studentId = `student_demo_4b_${i}`;
    batch.set(adminDb.collection("users").doc(studentId), {
      role: UserRole.STUDENT,
      institutionId: DEMO_INSTITUTION_ID,
      createdAt: new Date().toISOString()
    });

    batch.set(adminDb.collection("studentProfiles").doc(studentId), {
      userId: studentId,
      institutionId: DEMO_INSTITUTION_ID,
      firstName: `Demo${i}`,
      lastName: "Student",
      major: i < 4 ? "Computer Science" : "Data Science",
      degreeLevel: "BACHELORS",
      graduationYear: 2026,
      skills: [
        { skillId: "python", level: 3, verified: true },
        { skillId: "react", level: 2, verified: false }
      ]
    });

    // Seed Applications and Projects
    const isAccepted = i < 8; // 80% acceptance rate
    const appId = `app_demo_4b_${i}`;
    const projectId = `proj_demo_4b_${i}`;

    batch.set(adminDb.collection("applications").doc(appId), {
      id: appId,
      studentId: studentId,
      applicantId: studentId,
      problemId: "problem_demo_1",
      status: isAccepted ? ApplicationStatus.ACCEPTED : ApplicationStatus.REJECTED,
      synergyBridgeFitScore: 75 + i,
      submittedAt: new Date().toISOString()
    });

    if (isAccepted) {
      const isCompleted = i < 5; // 5 out of 8 completed
      batch.set(adminDb.collection("projects").doc(projectId), {
        id: projectId,
        problemId: "problem_demo_1",
        studentIds: [studentId],
        mentorId: "mentor_demo_1",
        status: isCompleted ? ProjectStatus.COMPLETED : (i === 7 ? ProjectStatus.ON_HOLD : ProjectStatus.IN_PROGRESS),
        progress: isCompleted ? 100 : (i === 7 ? 20 : 60),
        createdAt: new Date().toISOString(),
        institutionId: DEMO_INSTITUTION_ID
      });

      if (isCompleted) {
        batch.set(adminDb.collection("certificates").doc(`cert_demo_4b_${i}`), {
          studentId,
          projectId,
          issuedAt: new Date().toISOString(),
          isValid: true
        });
      }
    }
  }

  // Commit batch
  await batch.commit();
  console.log(`Successfully seeded Phase 4B Demo Data. Institution ID: ${DEMO_INSTITUTION_ID}`);
}

seedPhase4B().catch(console.error);
