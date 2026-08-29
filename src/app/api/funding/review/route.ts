import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
const auth = getAuth();
import { adminDb } from "@/lib/firebase/admin";
import { fundingService } from "@/lib/server/funding-service";
import { z } from "zod";

const reviewSchema = z.object({
  grantId: z.string(),
  decision: z.enum(["APPROVE", "REJECT"]),
  approvedAmount: z.number().positive().optional(),
  rejectionReason: z.string().optional(),
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
      return NextResponse.json({ error: "Students cannot review funding" }, { status: 403 });
    }
    const reviewerName = userSnap.data()?.displayName || "Reviewer";

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data", details: parsed.error }, { status: 422 });
    }

    const { grantId, decision, approvedAmount, rejectionReason } = parsed.data;

    const grant = await fundingService.reviewFunding(grantId, decision, approvedAmount, decodedToken.uid, reviewerName, rejectionReason);
    
    return NextResponse.json({ grant });
  } catch (error: unknown) {
    console.error("Funding Review Error:", error);
    return NextResponse.json({ error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) || "Internal server error" }, { status: 500 });
  }
}
