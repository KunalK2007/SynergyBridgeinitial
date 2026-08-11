import { adminDb } from "../firebase/admin";
import { FundingGrant, FundingStatus, FundingMilestone } from "@/types/funding";
import { FUNDING_TIERS, ORIGINALITY_PASS_THRESHOLD } from "../constants/funding";
import { ProjectActivity, ActivityType } from "@/types/project-activity";
import { OriginalityReport } from "@/types/originality";
import { GamificationEventType } from "@/types/gamification";
import { processGamificationEvent } from "./gamification-service";
import { v4 as uuidv4 } from "uuid";

export class FundingService {
  /**
   * Request funding for a project. Idempotent based on project and tier.
   */
  async requestFunding(
    projectId: string,
    tierId: "SEED" | "GROWTH" | "INNOVATION",
    requestedAmount: number,
    requestedBy: string,
    requesterName: string
  ): Promise<FundingGrant> {
    return await adminDb.runTransaction(async (t: FirebaseFirestore.Transaction) => {
      // Validate Tier
      const tierConfig = FUNDING_TIERS[tierId];
      if (!tierConfig) throw new Error("Invalid funding tier.");

      if (requestedAmount <= 0 || requestedAmount > tierConfig.maxAmount) {
        throw new Error(`Requested amount must be between 1 and ${tierConfig.maxAmount} ${tierConfig.currency}.`);
      }

      // 1. Check existing pending request
      const existingSnap = await t.get(
        adminDb.collection("fundingGrants")
          .where("projectId", "==", projectId)
          .where("tier", "==", tierId)
          .where("status", "in", [FundingStatus.REQUESTED, FundingStatus.UNDER_REVIEW])
      );

      if (!existingSnap.empty) {
        throw new Error(`A funding request for ${tierId} is already pending.`);
      }

      // Check for approved/disbursed duplicate
      const duplicateSnap = await t.get(
        adminDb.collection("fundingGrants")
          .where("projectId", "==", projectId)
          .where("tier", "==", tierId)
          .where("status", "in", [FundingStatus.APPROVED, FundingStatus.DISBURSED, FundingStatus.COMPLETED])
      );

      if (!duplicateSnap.empty) {
        throw new Error(`Funding for ${tierId} has already been approved.`);
      }

      // 2. Fetch Project & Originality
      const projectRef = adminDb.collection("projects").doc(projectId);
      const projectSnap = await t.get(projectRef);
      if (!projectSnap.exists) throw new Error("Project not found.");
      // const project = projectSnap.data();

      // Originality Check
      const originalitySnap = await t.get(
        adminDb.collection("originalityReports")
          .where("projectId", "==", projectId)
          .orderBy("version", "desc")
          .limit(1)
      );

      let originalityScore = 0;
      if (!originalitySnap.empty) {
        const report = originalitySnap.docs[0].data() as OriginalityReport;
        originalityScore = report.score;
      }

      if (originalityScore < tierConfig.minOriginalityScore) {
        throw new Error(`Originality score ${originalityScore} is below the minimum ${tierConfig.minOriginalityScore} required for ${tierId}.`);
      }

      const grantId = uuidv4();
      const now = new Date().toISOString();

      const grant: FundingGrant = {
        id: grantId,
        projectId,
        requestedAmount,
        currency: tierConfig.currency as "INR" | "USD",
        tier: tierId,
        source: "SynergyBridge Micro-Funding",
        status: FundingStatus.REQUESTED,
        originalityScore,
        milestones: [
          {
            id: uuidv4(),
            title: "Initial Disbursal",
            amount: requestedAmount,
            status: "PENDING",
          }
        ],
        requestedBy,
        createdAt: now,
        updatedAt: now,
      };

      t.set(adminDb.collection("fundingGrants").doc(grantId), grant);

      // Audit Logging
      const activityRef = adminDb.collection("projects").doc(projectId).collection("activity").doc();
      const activity: ProjectActivity = {
        id: activityRef.id,
        projectId,
        actorId: requestedBy,
        actorName: requesterName,
        action: ActivityType.FUNDING_REQUESTED,
        entityType: "FUNDING",
        entityId: grantId,
        metadata: {
          tier: tierId,
          requestedAmount,
        },
        createdAt: Date.now(),
      };
      t.set(activityRef, activity);

      return grant;
    });
  }

  /**
   * Review (Approve/Reject) a funding request.
   */
  async reviewFunding(
    grantId: string,
    decision: "APPROVE" | "REJECT",
    approvedAmount: number | undefined,
    reviewerId: string,
    reviewerName: string,
    rejectionReason?: string
  ): Promise<FundingGrant> {
    return await adminDb.runTransaction(async (t: FirebaseFirestore.Transaction) => {
      const grantRef = adminDb.collection("fundingGrants").doc(grantId);
      const grantSnap = await t.get(grantRef);

      if (!grantSnap.exists) throw new Error("Funding grant not found.");
      const grant = grantSnap.data() as FundingGrant;

      if (grant.status !== FundingStatus.REQUESTED && grant.status !== FundingStatus.UNDER_REVIEW) {
        throw new Error(`Cannot review grant in status: ${grant.status}`);
      }

      const tierConfig = FUNDING_TIERS[grant.tier];
      const now = new Date().toISOString();

      if (decision === "APPROVE") {
        const finalAmount = approvedAmount || grant.requestedAmount;
        if (finalAmount <= 0 || finalAmount > tierConfig.maxAmount) {
          throw new Error(`Approved amount must be between 1 and ${tierConfig.maxAmount} ${tierConfig.currency}.`);
        }
        
        grant.status = FundingStatus.APPROVED;
        grant.approvedAmount = finalAmount;
        
        // Adjust milestone if amount changed
        if (grant.milestones.length === 1) {
          grant.milestones[0].amount = finalAmount;
        }

        t.update(grantRef, {
          status: FundingStatus.APPROVED,
          approvedAmount: finalAmount,
          milestones: grant.milestones,
          reviewedBy: reviewerId,
          reviewedAt: now,
          updatedAt: now,
        });

      } else {
        grant.status = FundingStatus.REJECTED;
        grant.rejectionReason = rejectionReason;

        t.update(grantRef, {
          status: FundingStatus.REJECTED,
          rejectionReason: rejectionReason,
          reviewedBy: reviewerId,
          reviewedAt: now,
          updatedAt: now,
        });
      }

      // Audit Logging
      const activityRef = adminDb.collection("projects").doc(grant.projectId).collection("activity").doc();
      const activity: ProjectActivity = {
        id: activityRef.id,
        projectId: grant.projectId,
        actorId: reviewerId,
        actorName: reviewerName,
        action: decision === "APPROVE" ? ActivityType.FUNDING_APPROVED : ActivityType.FUNDING_REJECTED,
        entityType: "FUNDING",
        entityId: grantId,
        metadata: {
          approvedAmount: grant.approvedAmount,
          rejectionReason,
        },
        createdAt: Date.now(),
      };
      t.set(activityRef, activity);

      return grant;
    });
  }

  /**
   * Release a milestone (Disburse funding).
   */
  async disburseMilestone(
    grantId: string,
    milestoneId: string,
    disburserId: string,
    disburserName: string
  ): Promise<FundingGrant> {
    return await adminDb.runTransaction(async (t: FirebaseFirestore.Transaction) => {
      const grantRef = adminDb.collection("fundingGrants").doc(grantId);
      const grantSnap = await t.get(grantRef);

      if (!grantSnap.exists) throw new Error("Funding grant not found.");
      const grant = grantSnap.data() as FundingGrant;

      if (grant.status !== FundingStatus.APPROVED && grant.status !== FundingStatus.DISBURSED) {
        throw new Error(`Cannot disburse grant in status: ${grant.status}`);
      }

      const milestoneIndex = grant.milestones.findIndex(m => m.id === milestoneId);
      if (milestoneIndex === -1) throw new Error("Milestone not found.");
      
      const milestone = grant.milestones[milestoneIndex];

      if (milestone.status === "RELEASED" || milestone.status === "COMPLETED") {
        // Idempotent
        return grant;
      }

      const now = new Date().toISOString();
      milestone.status = "RELEASED";
      milestone.releasedAt = now;
      milestone.releasedBy = disburserId;

      grant.disbursedAmount = (grant.disbursedAmount || 0) + milestone.amount;
      
      const allReleased = grant.milestones.every(m => m.status === "RELEASED" || m.status === "COMPLETED");
      if (allReleased) {
        grant.status = FundingStatus.DISBURSED;
      }

      t.update(grantRef, {
        status: grant.status,
        disbursedAmount: grant.disbursedAmount,
        milestones: grant.milestones,
        updatedAt: now,
      });

      // Audit Logging
      const activityRef = adminDb.collection("projects").doc(grant.projectId).collection("activity").doc();
      const activity: ProjectActivity = {
        id: activityRef.id,
        projectId: grant.projectId,
        actorId: disburserId,
        actorName: disburserName,
        action: ActivityType.FUNDING_DISBURSED,
        entityType: "FUNDING",
        entityId: grantId,
        metadata: {
          milestoneId,
          amount: milestone.amount,
        },
        createdAt: Date.now(),
      };
      t.set(activityRef, activity);

      return grant;
    }).then(async (grant) => {
      // Trigger gamification for milestone released
      const projectSnap = await adminDb.collection("projects").doc(grant.projectId).get();
      if (projectSnap.exists) {
        const projectData = projectSnap.data();
        const studentIds = projectData?.participantIds || [];
        
        for (const sId of studentIds) {
          await processGamificationEvent(sId, GamificationEventType.FUNDING_MILESTONE_REACHED, milestoneId as string, { projectId: grant.projectId, grantId });
        }
      }
      return grant;
    });
  }
}

export const fundingService = new FundingService();
