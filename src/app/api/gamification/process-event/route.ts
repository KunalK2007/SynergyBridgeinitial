import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { GamificationEventType } from "@/types/gamification";
import { processGamificationEvent } from "@/lib/server/gamification-service";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await req.json();
    const { eventType, sourceId, metadata } = body;

    if (!eventType || !sourceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Authoritative Validation
    const isValid = await validateEvent(userId, eventType, sourceId);
    if (!isValid) {
      return NextResponse.json({ error: "Event validation failed" }, { status: 403 });
    }

    const result = await processGamificationEvent(
      userId,
      eventType as GamificationEventType,
      sourceId,
      metadata
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Gamification API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function validateEvent(userId: string, eventType: string, sourceId: string): Promise<boolean> {
  switch (eventType) {
    case GamificationEventType.TASK_COMPLETED:
      // Verify task exists and is DONE
      const taskDoc = await adminDb.collection("tasks").doc(sourceId).get();
      if (!taskDoc.exists) return false;
      const task = taskDoc.data();
      if (task?.status !== "DONE") return false;
      // In a full implementation, verify user is in task.projectId team
      return true;

    case GamificationEventType.MILESTONE_COMPLETED:
      const msDoc = await adminDb.collection("milestones").doc(sourceId).get();
      if (!msDoc.exists) return false;
      if (msDoc.data()?.status !== "COMPLETED") return false;
      return true;

    case GamificationEventType.PROJECT_COMPLETED:
      const pDoc = await adminDb.collection("projects").doc(sourceId).get();
      if (!pDoc.exists) return false;
      if (pDoc.data()?.status !== "COMPLETED") return false;
      return true;

    case GamificationEventType.APPLICATION_SUBMITTED:
    case GamificationEventType.APPLICATION_ACCEPTED:
      const appDoc = await adminDb.collection("applications").doc(sourceId).get();
      if (!appDoc.exists) return false;
      const app = appDoc.data();
      if (app?.studentId !== userId) return false;
      if (eventType === GamificationEventType.APPLICATION_ACCEPTED && app?.status !== "ACCEPTED") {
        return false;
      }
      return true;

    case GamificationEventType.PROFILE_COMPLETED:
      if (sourceId !== userId) return false;
      // Verify profile fields
      const profileDoc = await adminDb.collection("users").doc(userId).get();
      if (!profileDoc.exists) return false;
      const data = profileDoc.data();
      if (!data?.displayName || !data?.institutionId) return false;
      return true;

    default:
      // For MVP, permit others but ideally we'd validate all
      return true;
  }
}
