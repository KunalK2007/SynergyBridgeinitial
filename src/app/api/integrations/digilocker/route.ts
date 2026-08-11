import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
const auth = getAuth();
import { adminDb } from "@/lib/firebase/admin";
import { pushCredentialToDigiLocker } from "@/lib/services/digilocker";
import { z } from "zod";
import { Certificate, ExternalCredentialStatus } from "@/types/certificate";
import { ProjectActivity, ActivityType } from "@/types/project-activity";

const digilockerSchema = z.object({
  certificateId: z.string(),
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
    const parsed = digilockerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 422 });
    }

    const { certificateId } = parsed.data;

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

      if (cert.digiLockerStatus === ExternalCredentialStatus.SYNCED || cert.digiLockerStatus === ExternalCredentialStatus.MOCK) {
        // Idempotent
        return NextResponse.json({ 
          status: cert.digiLockerStatus,
          simulated: true,
          mode: "MOCK"
        });
      }

      const result = await pushCredentialToDigiLocker(cert);

      t.update(certRef, {
        digiLockerStatus: result.status,
        updatedAt: new Date().toISOString(),
      });

      // Audit Logging
      const activityRef = adminDb.collection("projects").doc(cert.projectId).collection("activity").doc();
      const activity: ProjectActivity = {
        id: activityRef.id,
        projectId: cert.projectId,
        actorId: decodedToken.uid,
        actorName: requesterName,
        action: ActivityType.DIGILOCKER_SYNC_REQUESTED,
        entityType: "INTEGRATION",
        entityId: certificateId,
        metadata: {
          simulated: true,
          referenceId: result.referenceId,
        },
        createdAt: Date.now(),
      };
      t.set(activityRef, activity);

      return NextResponse.json(result);
    });

  } catch (error: unknown) {
    console.error("DigiLocker Sync Error:", error);
    return NextResponse.json({ error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) || "Internal server error" }, { status: 500 });
  }
}
