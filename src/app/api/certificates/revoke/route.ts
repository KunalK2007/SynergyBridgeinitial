import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
const auth = getAuth();
import { adminDb } from "@/lib/firebase/admin";
import { certificateService } from "@/lib/server/certificate-service";
import { z } from "zod";

const revokeSchema = z.object({
  certificateId: z.string(),
  reason: z.string().min(5),
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
    const userRole = userSnap.data()?.role;
    if (userRole === "STUDENT") {
      return NextResponse.json({ error: "Students cannot revoke certificates" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = revokeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data", details: parsed.error }, { status: 422 });
    }

    const { certificateId, reason } = parsed.data;
    const revokerName = userSnap.data()?.displayName || "Authorized Admin";

    const cert = await certificateService.revokeCertificate(certificateId, reason, decodedToken.uid, revokerName);
    
    return NextResponse.json({ certificate: cert });
  } catch (error: unknown) {
    console.error("Certificate Revoke Error:", error);
    return NextResponse.json({ error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) || "Internal server error" }, { status: 500 });
  }
}
