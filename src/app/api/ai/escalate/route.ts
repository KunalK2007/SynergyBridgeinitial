import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { Project } from "@/types/project";
import { logProjectActivity } from "@/lib/utils/project-activity";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const studentId = decodedToken.uid;

    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const projectSnap = await adminDb.collection("projects").doc(projectId).get();
    if (!projectSnap.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const projectData = projectSnap.data() as Project;
    
    if (!projectData.studentIds.includes(studentId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!projectData.mentorId) {
      return NextResponse.json({ error: "No mentor assigned to this project" }, { status: 400 });
    }

    // Check for recent escalation to prevent spam (e.g. within last 1 hour)
    const recentActivitySnap = await adminDb.collection("projectActivity")
      .where("projectId", "==", projectId)
      .where("action", "==", "MENTOR_ESCALATION_REQUESTED")
      .where("createdBy", "==", studentId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (!recentActivitySnap.empty) {
      const lastEscalation = recentActivitySnap.docs[0].data();
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (lastEscalation.createdAt > oneHourAgo) {
         return NextResponse.json({ error: "Escalation request already sent recently. Please wait for your mentor." }, { status: 429 });
      }
    }

    // Create activity event
    await adminDb.collection("projectActivity").add({
      projectId,
      action: "MENTOR_ESCALATION_REQUESTED",
      entityType: "PROJECT",
      entityId: projectId,
      createdBy: studentId,
      createdAt: Date.now()
    });

    // Create notification for mentor (assuming notifications collection exists)
    await adminDb.collection("notifications").add({
      userId: projectData.mentorId,
      type: "ESCALATION",
      title: "Student requested help",
      message: `A student has requested your help on project: ${projectData.title}`,
      read: false,
      link: `/dashboard/projects/${projectId}`,
      createdAt: Date.now()
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Escalation Endpoint Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
