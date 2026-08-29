import { adminDb } from "../firebase/admin";
import { OriginalityAssessmentInput, calculateOriginalityScore } from "../utils/originality";
import { OriginalityReport } from "@/types/originality";
import { ActivityType, ProjectActivity } from "@/types/project-activity";
import { GamificationEventType } from "@/types/gamification";
import { processGamificationEvent } from "./gamification-service";

export class OriginalityService {
  async assessOriginality(input: OriginalityAssessmentInput): Promise<OriginalityReport> {
    return await adminDb.runTransaction(async (t: FirebaseFirestore.Transaction) => {
      const projectRef = adminDb.collection("projects").doc(input.projectId);
      const projectSnap = await t.get(projectRef);
      if (!projectSnap.exists) throw new Error("Project not found");

      // Fetch the latest version
      const existingReportsSnap = await t.get(
        adminDb.collection("originalityReports")
          .where("projectId", "==", input.projectId)
          .orderBy("version", "desc")
          .limit(1)
      );

      let existingVersion = 0;
      if (!existingReportsSnap.empty) {
        existingVersion = existingReportsSnap.docs[0].data().version;
      }

      const reportInput = {
        ...input,
        existingVersion,
      };

      const report = calculateOriginalityScore(reportInput);

      // Persist the report
      const reportRef = adminDb.collection("originalityReports").doc(report.id);
      t.set(reportRef, report);

      // Audit Logging
      const activityRef = adminDb.collection("projects").doc(input.projectId).collection("activity").doc();
      const activity: ProjectActivity = {
        id: activityRef.id,
        projectId: input.projectId,
        actorId: input.assessorId,
        actorName: "System/Reviewer", // Typically you fetch the reviewer name
        action: ActivityType.ORIGINALITY_ASSESSED,
        entityType: "ORIGINALITY",
        entityId: report.id,
        metadata: {
          score: report.score,
          passed: report.passed,
          version: report.version,
        },
        createdAt: Date.now(),
      };
      t.set(activityRef, activity);

      return report;
    }).then(async (report) => {
      // Trigger gamification if passed
      if (report.passed) {
        // Get project participants to award XP
        const projectSnap = await adminDb.collection("projects").doc(input.projectId).get();
        if (projectSnap.exists) {
          const projectData = projectSnap.data();
          const studentIds = projectData?.participantIds || [];
          
          for (const sId of studentIds) {
            await processGamificationEvent(sId, GamificationEventType.ORIGINALITY_PASSED, report.id, { projectId: input.projectId });
          }
        }
      }
      return report;
    });
  }
}

export const originalityService = new OriginalityService();
