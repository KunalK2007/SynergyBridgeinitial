import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { fundingService } from "@/lib/server/funding-service";
import { z } from "zod";

const requestSchema = z.object({
  projectId: z.string(),
  tier: z.enum(["SEED", "GROWTH", "INNOVATION"]),
  requestedAmount: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const userSnap = await adminDb.collection("users").doc(decodedToken.uid).get();
    const requesterName = userSnap.data()?.displayName || "Student";

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data", details: parsed.error }, { status: 422 });
    }

    const { projectId, tier, requestedAmount } = parsed.data;

    const projectSnap = await adminDb.collection("projects").doc(projectId).get();
    if (!projectSnap.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const project = projectSnap.data();
    if (!project?.participantIds.includes(decodedToken.uid)) {
      return NextResponse.json({ error: "Only participants can request funding" }, { status: 403 });
    }

    const grant = await fundingService.requestFunding(projectId, tier, requestedAmount, decodedToken.uid, requesterName);
    
    return NextResponse.json({ grant });
  } catch (error: unknown) {
    console.error("Funding Request Error:", error);
    return NextResponse.json({ error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) || "Internal server error" }, { status: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)).includes("already") ? 409 : 500 });
  }
}
