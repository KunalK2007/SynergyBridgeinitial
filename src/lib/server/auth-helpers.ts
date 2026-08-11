import { adminDb } from "@/lib/firebase/admin";
import { Project } from "@/types/project";
import { UserRole } from "@/types/auth";

export async function getProject(projectId: string): Promise<Project | null> {
  const snap = await adminDb.collection("projects").doc(projectId).get();
  if (!snap.exists) return null;
  return snap.data() as Project;
}

export async function canAccessProject(
  userId: string,
  userRole: UserRole,
  projectId: string
): Promise<boolean> {
  // Admins can access all
  if (userRole === UserRole.ADMIN) return true;

  const project = await getProject(projectId);
  if (!project) return false;

  // Student participant
  if (project.studentIds.includes(userId)) return true;

  // Mentor assigned
  if (project.mentorId === userId) return true;

  // Coordinator assigned
  if (project.coordinatorId === userId) return true;

  return false;
}

export async function canModifyProject(
  userId: string,
  userRole: UserRole,
  projectId: string
): Promise<boolean> {
  // Admins can modify
  if (userRole === UserRole.ADMIN) return true;

  const project = await getProject(projectId);
  if (!project) return false;

  // Students cannot generically modify the project document (only tasks/milestones through specific endpoints)
  // Mentor can modify mentor-specific fields
  // Coordinator can modify project status etc.
  
  // This helper should be contextual, but as a baseline:
  if (project.coordinatorId === userId) return true;
  if (project.mentorId === userId) return true;
  if (project.studentIds.includes(userId)) return true;

  return false;
}
