import { adminDb } from "@/lib/firebase/admin";
import { Project } from "@/types/project";
import { UserRole } from "@/types/auth";

/**
 * Retrieves the list of projects a user is authorized to view,
 * adhering to the platform's role-based authorization model without
 * relying on client-side full collection scans.
 */
export async function getAuthorizedProjectsList(uid: string, role: UserRole): Promise<Project[]> {
  const projectsRef = adminDb.collection("projects");
  let query: FirebaseFirestore.Query = projectsRef;

  switch (role) {
    case UserRole.ADMIN:
      // Admins have global access
      break;
    
    case UserRole.STUDENT:
      query = projectsRef.where("studentIds", "array-contains", uid);
      break;
    
    case UserRole.MENTOR:
      query = projectsRef.where("mentorId", "==", uid);
      break;
    
    case UserRole.FACULTY:
      // Faculty view projects they coordinate
      query = projectsRef.where("coordinatorId", "==", uid);
      break;
    
    case UserRole.INDUSTRY:
    case UserRole.GOVERNMENT:
    case UserRole.INCUBATION:
      // Problem posters are authorized to see projects spawned from their problems.
      const problemsSnap = await adminDb.collection("problems")
        .where("posterId", "==", uid)
        .get();
      
      const problemIds = problemsSnap.docs.map(d => d.id);
      
      if (problemIds.length === 0) {
        return [];
      }
      
      // Handle Firestore 'in' query limit (max 30 elements)
      if (problemIds.length > 30) {
        const projects: Project[] = [];
        for (let i = 0; i < problemIds.length; i += 30) {
          const chunk = problemIds.slice(i, i + 30);
          const snap = await projectsRef.where("problemId", "in", chunk).get();
          projects.push(...snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
        }
        return projects;
      } else {
        query = projectsRef.where("problemId", "in", problemIds);
      }
      break;
      
    default:
      return [];
  }

  // Only execute if query hasn't already been resolved via chunking
  const snap = await query.get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
}
