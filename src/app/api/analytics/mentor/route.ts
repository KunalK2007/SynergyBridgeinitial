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
    if (userData?.role !== UserRole.MENTOR && userData?.role !== UserRole.ADMIN && userData?.role !== UserRole.FACULTY) {
      return NextResponse.json({ error: "Forbidden: Unauthorized access to mentor analytics" }, { status: 403 });
    }
    
    // Check if the request is from a coordinator/admin fetching a specific mentor's stats
    const { searchParams } = new URL(req.url);
    const requestedMentorId = searchParams.get("mentorId");
    
    let targetMentorId = decodedToken.uid;
    
    if (requestedMentorId && requestedMentorId !== decodedToken.uid) {
      if (userData?.role !== UserRole.ADMIN && userData?.role !== UserRole.FACULTY) {
        return NextResponse.json({ error: "Forbidden: Cannot access other mentor analytics" }, { status: 403 });
      }
      
      // If coordinator, must verify the target mentor is in the same institution.
      if (userData?.role === UserRole.FACULTY) {
        const targetMentorSnap = await adminDb.collection("users").doc(requestedMentorId).get();
        if (!targetMentorSnap.exists || targetMentorSnap.data()?.institutionId !== userData?.institutionId) {
          return NextResponse.json({ error: "Forbidden: Mentor not in your institution" }, { status: 403 });
        }
      }
      
      targetMentorId = requestedMentorId;
    }
    
    const analytics = await AnalyticsEngine.getMentorAnalytics(targetMentorId);
    return NextResponse.json(analytics, { status: 200 });

  } catch (error) {
    console.error("Mentor Analytics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
