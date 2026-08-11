import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getAuthorizedProjectsList } from "@/lib/server/project-service";
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
    
    // Get user role
    const userSnap = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userData = userSnap.data();
    if (!userData || !userData.role) {
      return NextResponse.json({ error: "Role not found for user" }, { status: 400 });
    }
    
    // Fetch authorized projects
    const projects = await getAuthorizedProjectsList(decodedToken.uid, userData.role as UserRole);
    
    return NextResponse.json({ projects }, { status: 200 });

  } catch (error) {
    console.error("Projects API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
