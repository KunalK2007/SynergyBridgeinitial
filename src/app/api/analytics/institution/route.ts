import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { AnalyticsEngine } from "@/lib/analytics/analytics-engine";
import { UserRole } from "@/types/auth";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    
    // Verify auth
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Verify role
    const userSnap = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userData = userSnap.data();
    if (userData?.role !== UserRole.FACULTY && userData?.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Unauthorized access to institution analytics" }, { status: 403 });
    }
    
    // Server determines the institution ID
    let targetInstitutionId = userData?.institutionId;

    // Admin can request any institution's analytics
    if (userData?.role === UserRole.ADMIN) {
      const { searchParams } = new URL(req.url);
      const requestedInstId = searchParams.get("institutionId");
      if (requestedInstId) {
        targetInstitutionId = requestedInstId;
      }
    }

    if (!targetInstitutionId) {
      return NextResponse.json({ error: "Institution ID not found for user" }, { status: 400 });
    }
    
    const analytics = await AnalyticsEngine.getInstitutionAnalytics(targetInstitutionId, true);
    return NextResponse.json(analytics, { status: 200 });

  } catch (error) {
    console.error("Institution Analytics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
