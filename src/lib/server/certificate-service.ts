import { adminDb } from "../firebase/admin";
import { Certificate, CertificateStatus, BlockchainStatus, ExternalCredentialStatus } from "@/types/certificate";
import { Project } from "@/types/project";
import { StudentProfile } from "@/types/profile";
import { Task } from "@/types/task";
import { Milestone } from "@/types/milestone";
import { OriginalityReport } from "@/types/originality";
import { canIssueCertificate, CertificateEligibilityResult } from "../utils/certificate-eligibility";
import { v4 as uuidv4 } from "uuid";
import { blockchainService } from "../services/blockchain";
import { ActivityType, ProjectActivity } from "@/types/project-activity";
import { GamificationEventType } from "@/types/gamification";
import { processGamificationEvent } from "./gamification-service";
import crypto from "crypto";

export class CertificateService {
  /**
   * Evaluates eligibility without issuing a certificate.
   */
  async getCertificateEligibility(
    projectId: string,
    studentId: string
  ): Promise<CertificateEligibilityResult> {
    const projectSnap = await adminDb.collection("projects").doc(projectId).get();
    if (!projectSnap.exists) throw new Error("Project not found");
    const project = projectSnap.data() as Project;

    const studentSnap = await adminDb.collection("studentProfiles").doc(studentId).get();
    if (!studentSnap.exists) throw new Error("Student profile not found");
    const student = studentSnap.data() as StudentProfile;

    const tasksSnap = await adminDb.collection("projects").doc(projectId).collection("tasks").get();
    const tasks = tasksSnap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.data() as Task);

    const milestonesSnap = await adminDb.collection("projects").doc(projectId).collection("milestones").get();
    const milestones = milestonesSnap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.data() as Milestone);

    // Get latest Originality Report
    const originalitySnap = await adminDb.collection("originalityReports")
      .where("projectId", "==", projectId)
      .orderBy("version", "desc")
      .limit(1)
      .get();
      
    let originalityScore: number | null = null;
    if (!originalitySnap.empty) {
      originalityScore = (originalitySnap.docs[0].data() as OriginalityReport).score;
    }

    return canIssueCertificate(project, student, tasks, milestones, originalityScore);
  }

  /**
   * Issues a certificate transactionally. Idempotent based on projectId + studentId.
   */
  async issueCertificate(
    projectId: string,
    studentId: string,
    issuerId: string,
    issuerName: string
  ): Promise<Certificate> {
    return await adminDb.runTransaction(async (t: FirebaseFirestore.Transaction) => {
      // 1. Check for existing certificate (Idempotency)
      const existingCertSnap = await t.get(
        adminDb.collection("certificates")
          .where("projectId", "==", projectId)
          .where("studentId", "==", studentId)
          .where("status", "==", CertificateStatus.ISSUED)
          .limit(1)
      );

      if (!existingCertSnap.empty) {
        return existingCertSnap.docs[0].data() as Certificate;
      }

      // 2. Fetch all required data within transaction
      const projectRef = adminDb.collection("projects").doc(projectId);
      const projectSnap = await t.get(projectRef);
      if (!projectSnap.exists) throw new Error("Project not found");
      const project = projectSnap.data() as Project;

      const studentRef = adminDb.collection("studentProfiles").doc(studentId);
      const studentSnap = await t.get(studentRef);
      if (!studentSnap.exists) throw new Error("Student profile not found");
      const student = studentSnap.data() as StudentProfile;

      const userRef = adminDb.collection("users").doc(studentId);
      const userSnap = await t.get(userRef);
      const studentName = userSnap.exists ? (userSnap.data()?.displayName || "Student") : "Student";

      // Tasks & Milestones can't be fetched within a Firestore transaction using standard queries if we modify multiple docs, 
      // but reading a collection is allowed in Admin SDK transactions.
      const tasksSnap = await t.get(adminDb.collection("projects").doc(projectId).collection("tasks"));
      const tasks = tasksSnap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.data() as Task);

      const milestonesSnap = await t.get(adminDb.collection("projects").doc(projectId).collection("milestones"));
      const milestones = milestonesSnap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.data() as Milestone);

      const originalitySnap = await t.get(
        adminDb.collection("originalityReports")
          .where("projectId", "==", projectId)
          .orderBy("version", "desc")
          .limit(1)
      );
      
      let originalityScore: number | null = null;
      let originalityReportId: string | undefined;
      
      if (!originalitySnap.empty) {
        const report = originalitySnap.docs[0].data() as OriginalityReport;
        originalityScore = report.score;
        originalityReportId = report.id;
      }

      // 3. Recalculate Eligibility Server-Side
      const eligibility = canIssueCertificate(project, student, tasks, milestones, originalityScore);
      if (!eligibility.eligible) {
        throw new Error(`Not eligible for certificate. Reasons: ${eligibility.reasons.join(", ")}`);
      }

      // 4. Generate Certificate Data
      const certId = uuidv4();
      
      // Cryptographically secure verification ID (short, readable)
      const verificationId = crypto.randomBytes(8).toString('hex').toUpperCase();

      const now = new Date().toISOString();

      const certificate: Certificate = {
        id: certId,
        verificationId,
        projectId,
        applicationId: "N/A", // MVP
        problemId: project.problemId,
        studentId,
        studentName,
        projectTitle: project.title,
        problemTitle: "SynergyBridge Problem", // Normally fetch problem title too
        issuedAt: now,
        status: CertificateStatus.ISSUED,
        certificateHash: "", // Computed below
        blockchainStatus: BlockchainStatus.NOT_REQUESTED,
        digiLockerStatus: ExternalCredentialStatus.NOT_REQUESTED,
        abcStatus: ExternalCredentialStatus.NOT_REQUESTED,
        originalityScore: originalityScore || 0,
        originalityReportId,
        issuerId,
        issuerName,
        eligibilitySnapshot: eligibility.snapshot,
        createdAt: now,
        updatedAt: now,
      };

      // 5. Generate Hash
      const { hash } = await blockchainService.createCredentialHash(certificate);
      certificate.certificateHash = hash;

      // 6. Write Certificate
      const certRef = adminDb.collection("certificates").doc(certId);
      t.set(certRef, certificate);

      // 7. Audit Logging
      const activityRef = adminDb.collection("projects").doc(projectId).collection("activity").doc();
      const activity: ProjectActivity = {
        id: activityRef.id,
        projectId,
        actorId: issuerId,
        actorName: issuerName,
        action: ActivityType.CERTIFICATE_ISSUED,
        entityType: "CERTIFICATE",
        entityId: certId,
        metadata: {
          verificationId,
        },
        createdAt: Date.now(),
      };
      t.set(activityRef, activity);

      return certificate;
    }).then(async (certificate) => {
      // Execute post-transaction side effects (Gamification)
      await processGamificationEvent(studentId, GamificationEventType.CERTIFICATE_ISSUED, certificate.id as string, { projectId });
      return certificate;
    });
  }

  /**
   * Revokes a certificate. Idempotent.
   */
  async revokeCertificate(
    certificateId: string,
    reason: string,
    revokerId: string,
    revokerName: string
  ): Promise<Certificate> {
    return await adminDb.runTransaction(async (t: FirebaseFirestore.Transaction) => {
      const certRef = adminDb.collection("certificates").doc(certificateId);
      const certSnap = await t.get(certRef);

      if (!certSnap.exists) {
        throw new Error("Certificate not found");
      }

      const cert = certSnap.data() as Certificate;

      if (cert.status === CertificateStatus.REVOKED) {
        // Idempotent
        return cert;
      }

      if (cert.status !== CertificateStatus.ISSUED) {
        throw new Error("Can only revoke ISSUED certificates.");
      }

      const now = new Date().toISOString();
      cert.status = CertificateStatus.REVOKED;
      cert.revokedAt = now;
      cert.revocationReason = reason;
      cert.updatedAt = now;

      t.update(certRef, {
        status: CertificateStatus.REVOKED,
        revokedAt: now,
        revocationReason: reason,
        updatedAt: now,
      });

      // Audit Logging
      const activityRef = adminDb.collection("projects").doc(cert.projectId).collection("activity").doc();
      const activity: ProjectActivity = {
        id: activityRef.id,
        projectId: cert.projectId,
        actorId: revokerId,
        actorName: revokerName,
        action: ActivityType.CERTIFICATE_REVOKED,
        entityType: "CERTIFICATE",
        entityId: certificateId,
        metadata: {
          reason,
        },
        createdAt: Date.now(),
      };
      t.set(activityRef, activity);

      return cert;
    });
  }
}

export const certificateService = new CertificateService();
