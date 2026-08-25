import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Certificate } from "@/types/certificate";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ verificationId: string }> }
) {
  try {
    const verificationId = (await context.params).verificationId;
    if (!verificationId) {
      return NextResponse.json({ valid: false, status: "NOT_FOUND" }, { status: 404 });
    }

    const certsSnap = await adminDb.collection("certificates")
      .where("verificationId", "==", verificationId)
      .limit(1)
      .get();

    if (certsSnap.empty) {
      return NextResponse.json({ valid: false, status: "NOT_FOUND" }, { status: 404 });
    }

    const cert = certsSnap.docs[0].data() as Certificate;

    if (cert.status === "REVOKED") {
      return NextResponse.json({
        valid: false,
        status: "REVOKED",
        revokedAt: cert.revokedAt,
      });
    }

    // Return stripped public data
    return NextResponse.json({
      valid: true,
      status: cert.status,
      verificationId: cert.verificationId,
      projectTitle: cert.projectTitle,
      problemTitle: cert.problemTitle,
      studentName: cert.studentName,
      institution: cert.institution || "SynergyBridge Authorized Institution",
      issuedAt: cert.issuedAt,
      credentialHash: cert.certificateHash,
      blockchain: {
        status: cert.blockchainStatus,
        simulated: cert.blockchainStatus === "MOCK",
      }
    });

  } catch (error: unknown) {
    console.error("Certificate Verification Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
