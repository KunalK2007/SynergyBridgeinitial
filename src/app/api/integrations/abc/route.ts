import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
const auth = getAuth();
import { adminDb } from "@/lib/firebase/admin";
import { submitAcademicCredits } from "@/lib/services/abc";
import { z } from "zod";
import { Certificate, ExternalCredentialStatus } from "@/types/certificate";
import { ProjectActivity, ActivityType } from "@/types/project-activity";

const abcSchema = z.object({
  certificateId: z.string(),
  credits: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    const userSnap = await adminDb.collection("users").doc(decodedToken.uid).get();
    const requesterName = userSnap.data()?.displayName || "User";

    const body = await req.json();
    const parsed = abcSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 422 });
    }

    const { certificateId, credits } = parsed.data;

    return await adminDb.runTransaction(async (t) => {
      const certRef = adminDb.collection("certificates").doc(certificateId);
      const certSnap = await t.get(certRef);

      if (!certSnap.exists) {
        throw new Error("Certificate not found");
      }
      const cert = certSnap.data() as Certificate;

      if (cert.studentId !== decodedToken.uid) {
        throw new Error("Unauthorized to sync this certificate");
      }

      if (cert.abcStatus === ExternalCredentialStatus.SYNCED || cert.abcStatus === ExternalCredentialStatus.MOCK) {
        // Idempotent
        return NextResponse.json({ 
          status: cert.abcStatus,
          simulated: true,
          mode: "MOCK"
        });
      }

      const result = await submitAcademicCredits(cert, credits);

      t.update(certRef, {
        abcStatus: result.status,
        academicCredits: credits,
        updatedAt: new Date().toISOString(),
      });

      // Audit Logging
      const activityRef = adminDb.collection("projects").doc(cert.projectId).collection("activity").doc();
      const activity: ProjectActivity = {
        id: activityRef.id,
        projectId: cert.projectId,
        actorId: decodedToken.uid,
        actorName: requesterName,
        action: ActivityType.ABC_SYNC_REQUESTED,
        entityType: "INTEGRATION",
        entityId: certificateId,
        metadata: {
          simulated: true,
          creditsSubmitted: credits,
          referenceId: result.referenceId,
        },
        createdAt: Date.now(),
      };
      t.set(activityRef, activity);

      return NextResponse.json(result);
    });

  } catch (error: unknown) {
    console.error("ABC Sync Error:", error);
    return NextResponse.json({ error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) || "Internal server error" }, { status: 500 });
  }
}
