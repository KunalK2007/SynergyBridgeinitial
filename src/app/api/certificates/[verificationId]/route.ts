import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Certificate, CertificateStatus, BlockchainStatus, ExternalCredentialStatus } from "@/types/certificate";

const SYNTHETIC_DEMO_CERTS: Record<string, Certificate> = {
  "SB-DEMO-WW95-2026": {
    id: "cert_demo_wastewise_1",
    verificationId: "SB-DEMO-WW95-2026",
    projectId: "demo_proj_7",
    applicationId: "demo_app_7",
    problemId: "demo_prob_1",
    studentId: "student_demo_uid",
    studentName: "Aarav Sharma",
    projectTitle: "WasteWise — Waste Classification & Collection Optimization",
    problemTitle: "Autonomous Municipal Waste Sorting & Route Optimization",
    institution: "SynergyBridge Demo Institute",
    department: "Computer Science & AI",
    course: "B.Tech",
    academicCredits: 4,
    issuedAt: "2026-08-20T10:00:00.000Z",
    status: CertificateStatus.ISSUED,
    certificateHash: "0x8e5f2a1b9c3d4e7f6a5b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
    blockchainStatus: BlockchainStatus.MOCK,
    blockchainTransactionId: "0x9a4f...3c82 (Simulated Polygon PoS)",
    digiLockerStatus: ExternalCredentialStatus.MOCK,
    abcStatus: ExternalCredentialStatus.MOCK,
    originalityScore: 96,
    originalityReportId: "cg_orig_7",
    issuerId: "faculty_demo_uid",
    issuerName: "Prof. Vikram Joshi",
    isDemo: true,
    createdAt: "2026-08-20T10:00:00.000Z",
    updatedAt: "2026-08-20T10:00:00.000Z",
  },
  "SB-DEMO-SM92-2026": {
    id: "cert_demo_skillmatch_1",
    verificationId: "SB-DEMO-SM92-2026",
    projectId: "demo_proj_8",
    applicationId: "demo_app_8",
    problemId: "demo_prob_3",
    studentId: "student_demo_uid",
    studentName: "Aarav Sharma",
    projectTitle: "SkillMatch — Multi-Disciplinary Skills-Based Match Platform",
    problemTitle: "Adaptive Multi-Disciplinary Engineering Problem Matching Engine",
    institution: "SynergyBridge Demo Institute",
    department: "Computer Science & AI",
    course: "B.Tech",
    academicCredits: 4,
    issuedAt: "2026-08-22T14:30:00.000Z",
    status: CertificateStatus.ISSUED,
    certificateHash: "0x7a4b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
    blockchainStatus: BlockchainStatus.MOCK,
    blockchainTransactionId: "0x7b1e...4d91 (Simulated Polygon PoS)",
    digiLockerStatus: ExternalCredentialStatus.MOCK,
    abcStatus: ExternalCredentialStatus.MOCK,
    originalityScore: 92,
    originalityReportId: "cg_orig_8",
    issuerId: "faculty_demo_uid",
    issuerName: "Prof. Vikram Joshi",
    isDemo: true,
    createdAt: "2026-08-22T14:30:00.000Z",
    updatedAt: "2026-08-22T14:30:00.000Z",
  }
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ verificationId: string }> }
) {
  try {
    const verificationId = (await context.params).verificationId;
    if (!verificationId) {
      return NextResponse.json({ valid: false, status: "NOT_FOUND" }, { status: 404 });
    }

    let cert: Certificate | null = null;

    try {
      const certsSnap = await adminDb.collection("certificates")
        .where("verificationId", "==", verificationId)
        .limit(1)
        .get();

      if (!certsSnap.empty) {
        cert = certsSnap.docs[0].data() as Certificate;
      } else {
        const directDoc = await adminDb.collection("certificates").doc(verificationId).get();
        if (directDoc.exists) {
          cert = directDoc.data() as Certificate;
        }
      }
    } catch (dbError) {
      console.warn("Firestore certificate lookup fallback:", dbError);
    }

    // Fallback to recognized synthetic demo certificates if not in Firestore
    if (!cert && SYNTHETIC_DEMO_CERTS[verificationId]) {
      cert = SYNTHETIC_DEMO_CERTS[verificationId];
    }

    if (!cert) {
      return NextResponse.json({ valid: false, status: "NOT_FOUND" }, { status: 404 });
    }

    if (cert.status === "REVOKED") {
      return NextResponse.json({
        valid: false,
        status: "REVOKED",
        revokedAt: cert.revokedAt,
      });
    }

    // Return stripped public data (No PII: no email, phone, UID, funding details, etc.)
    return NextResponse.json({
      valid: true,
      status: cert.status,
      verificationId: cert.verificationId,
      projectTitle: cert.projectTitle,
      problemTitle: cert.problemTitle,
      studentName: cert.studentName,
      institution: cert.institution || "SynergyBridge Authorized Institution",
      department: cert.department || "Engineering & Technology",
      academicCredits: cert.academicCredits || 4,
      issuedAt: cert.issuedAt,
      credentialHash: cert.certificateHash,
      isDemo: cert.isDemo ?? true,
      blockchain: {
        status: cert.blockchainStatus || BlockchainStatus.MOCK,
        simulated: cert.blockchainStatus === BlockchainStatus.MOCK || cert.isDemo === true || !cert.blockchainStatus,
      }
    });

  } catch (error: unknown) {
    console.error("Certificate Verification Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
