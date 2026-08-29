"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Project, ProjectStatus } from "@/types/project";
import { MentorProfile, MentorAvailability } from "@/types/mentor";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { logProjectActivity } from "@/lib/utils/project-activity";
import { ActivityType } from "@/types/project-activity";
import { createNotification } from "@/lib/services/notifications";
import { NotificationType } from "@/types/notification";

export default function AssignMentorPage() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!currentUser || !id) return;
      try {
        const pSnap = await getDoc(doc(db, "projects", id as string));
        if (!pSnap.exists()) {
          toast.error("Project not found");
          return router.push("/dashboard/projects");
        }
        
        const proj = { id: pSnap.id, ...pSnap.data() } as Project;
        
        // Authorization check: Admin or Faculty/Coordinator
        if (currentUser.role !== "ADMIN" && currentUser.role !== "FACULTY") {
          toast.error("Unauthorized");
          return router.push("/dashboard");
        }
        setProject(proj);

        // Load all available mentors
        const mRef = collection(db, "mentors");
        const mSnap = await getDocs(query(mRef, where("isAvailable", "==", true)));
        
        const loadedMentors = mSnap.docs.map(d => ({ id: d.id, ...d.data() } as MentorProfile));
        setMentors(loadedMentors);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, currentUser, router]);

  const handleAssign = async (mentor: MentorProfile) => {
    if (!project || !currentUser) return;

    if (mentor.currentProjectCount >= mentor.maxActiveProjects && currentUser.role !== "ADMIN") {
      toast.error("Mentor has reached maximum active projects limit.");
      return;
    }

    setAssigningId(mentor.id);
    try {
      const pRef = doc(db, "projects", project.id);
      await updateDoc(pRef, {
        mentorId: mentor.userId,
        updatedAt: new Date().getTime()
      });

      // Update mentor active count
      const mRef = doc(db, "mentors", mentor.id);
      await updateDoc(mRef, {
        currentProjectCount: mentor.currentProjectCount + 1,
        updatedAt: new Date().getTime()
      });

      // Log Activity
      await logProjectActivity(
        project.id,
        currentUser.uid,
        currentUser.role,
        ActivityType.MENTOR_ASSIGNED,
        "PROJECT",
        project.id,
        { mentorId: mentor.userId }
      );

      // Notify Mentor
      await createNotification(
        mentor.userId,
        NotificationType.PROJECT_CREATED,
        "New Project Assigned",
        `You have been assigned to project: ${project.title}`,
        `/dashboard/projects/${project.id}`
      );

      // Notify Students (simplification: notify first student, or loop)
      if (project.studentIds.length > 0) {
        for (const sid of project.studentIds) {
          await createNotification(
            sid,
            NotificationType.PROJECT_CREATED,
            "Mentor Assigned",
            `A mentor has been assigned to your project: ${project.title}`,
            `/dashboard/projects/${project.id}`
          );
        }
      }

      toast.success("Mentor assigned successfully");
      router.push(`/dashboard/projects/${project.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign mentor");
    } finally {
      setAssigningId(null);
    }
  };

  if (loading) return <div className="p-8 text-slate-400">Loading mentors...</div>;
  if (!project) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      <div>
        <Link href={`/dashboard/projects/${project.id}`} className="text-sm text-slate-400 hover:text-white flex items-center mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project
        </Link>
        <h1 className="text-3xl font-bold text-white tracking-tight">Assign Mentor</h1>
        <p className="text-slate-400 mt-2">Select an available mentor for <strong>{project.title}</strong>.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mentors.length === 0 ? (
          <div className="col-span-2 text-center p-8 bg-slate-900 border border-slate-800 rounded-lg">
            <p className="text-slate-400">No available mentors found.</p>
          </div>
        ) : (
          mentors.map(m => {
            const isFull = m.currentProjectCount >= m.maxActiveProjects;
            
            return (
              <Card key={m.id} className={isFull ? "opacity-60 grayscale" : ""}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-white">Mentor ID: {m.userId.substring(0, 8)}</h3>
                      <p className="text-sm text-slate-400">{m.organization || m.institutionId || "Independent"}</p>
                    </div>
                    {m.availabilityStatus === MentorAvailability.LIMITED ? (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-xs font-bold uppercase">
                        Limited
                      </span>
                    ) : (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-bold uppercase">
                        Available
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-slate-500 font-semibold mb-1">EXPERTISE</div>
                      <div className="flex flex-wrap gap-2">
                        {m.expertiseAreas.slice(0, 3).map(ex => (
                          <span key={ex} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs">
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-4 border-t border-slate-800">
                      <div className="flex items-center text-slate-300">
                        <span className="font-mono bg-slate-900 px-2 py-1 rounded mr-2">
                          {m.currentProjectCount} / {m.maxActiveProjects}
                        </span>
                        Projects
                      </div>
                      <Button 
                        onClick={() => handleAssign(m)}
                        disabled={assigningId === m.id || (isFull && currentUser?.role !== "ADMIN")}
                        className={isFull ? "bg-slate-700" : "bg-indigo-600 hover:bg-indigo-700"}
                      >
                        {assigningId === m.id ? "Assigning..." : "Assign"}
                      </Button>
                    </div>
                    {isFull && currentUser?.role === "ADMIN" && (
                      <div className="text-xs text-amber-500 flex items-center mt-2">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Admin Override Available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
