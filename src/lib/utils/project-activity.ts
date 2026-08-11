import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { ActivityType, ProjectActivity } from "@/types/project-activity";

export async function logProjectActivity(
  projectId: string,
  actorId: string,
  actorName: string,
  action: ActivityType,
  entityType: "TASK" | "MILESTONE" | "FILE" | "MESSAGE" | "PROJECT",
  entityId?: string,
  metadata?: Record<string, unknown> | null
): Promise<void> {
  const activityData: Omit<ProjectActivity, "id"> = {
    projectId,
    actorId,
    actorName,
    action,
    entityType,
    entityId,
    metadata,
    createdAt: Date.now()
  };

  try {
    await addDoc(collection(db, "projectActivities"), activityData);
  } catch (error) {
    console.error("Failed to log project activity", error);
  }
}
