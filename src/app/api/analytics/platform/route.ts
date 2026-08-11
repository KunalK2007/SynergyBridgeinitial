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
    
    // Verify role MUST BE ADMIN
    const userSnap = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userData = userSnap.data();
    if (userData?.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }
    
    const analytics = await AnalyticsEngine.getPlatformAnalytics();
    return NextResponse.json(analytics, { status: 200 });

  } catch (error) {
    console.error("Platform Analytics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
