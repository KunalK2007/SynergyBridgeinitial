import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
const auth = getAuth();
import { adminDb } from "@/lib/firebase/admin";
import { certificateService } from "@/lib/server/certificate-service";
import { z } from "zod";

const issueSchema = z.object({
  projectId: z.string(),
  studentId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Auth & Role check (Assuming reviewers or admins can issue)
    const userSnap = await adminDb.collection("users").doc(decodedToken.uid).get();
    const userRole = userSnap.data()?.role;
    if (userRole === "STUDENT") {
      return NextResponse.json({ error: "Students cannot issue certificates" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = issueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data", details: parsed.error }, { status: 422 });
    }

    const { projectId, studentId } = parsed.data;

    // TODO: implement strict rate limiting if required

    const issuerName = userSnap.data()?.displayName || "Authorized Reviewer";
    const cert = await certificateService.issueCertificate(projectId, studentId, decodedToken.uid, issuerName);
    
    return NextResponse.json({ certificate: cert });
  } catch (error: unknown) {
    console.error("Certificate Issue Error:", error);
    if ((error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error))?.includes("already issued")) {
      return NextResponse.json({ error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }, { status: 409 });
    }
    return NextResponse.json({ error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) || "Internal server error" }, { status: 500 });
  }
}
