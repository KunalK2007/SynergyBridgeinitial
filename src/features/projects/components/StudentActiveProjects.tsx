"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Project } from "@/types/project";
import { calculateProjectHealth, ProjectHealthStatus, ProjectHealthResult } from "@/lib/utils/project-health";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowRight, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export function StudentActiveProjects() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<{ project: Project; health: ProjectHealthResult; progress: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      try {
        const projSnap = await getDocs(query(collection(db, "projects"), where("studentIds", "array-contains", currentUser.uid)));
        const loaded = projSnap.docs.map(d => {
          const p = { id: d.id, ...d.data() } as Project;
          const health = calculateProjectHealth(p.updatedAt, now, p.targetCompletionDate, p.progress || 0);
          return { project: p, health, progress: p.progress || 0 };
        });
        setProjects(loaded);
      } catch (err) {
        console.error("Failed to load student projects", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser, now]);

  if (loading || projects.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-xl font-bold text-[#1C1C1E]">Your Active Projects</h2>
      <div className="grid grid-cols-1 gap-4">
        {projects.map(({ project, health, progress }) => {
          let HealthIcon = CheckCircle;
          let healthColor = "text-emerald-600";
          if (health.status === ProjectHealthStatus.AT_RISK) {
            HealthIcon = AlertTriangle;
            healthColor = "text-amber-600";
          } else if (health.status === ProjectHealthStatus.STALLED) {
            HealthIcon = Clock;
            healthColor = "text-red-600";
          }

          return (
            <Card key={project.id} className="border-[#9C7A4C]/20 shadow-[0_0_15px_rgba(156,122,76,0.05)]">
              <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`flex items-center text-xs font-bold uppercase ${healthColor}`}>
                      <HealthIcon className="w-3 h-3 mr-1" /> {health.status.replace("_", " ")}
                    </span>
                    <span className="text-[#5B5F73] text-xs">•</span>
                    <span className="text-[#5B5F73] text-xs uppercase font-bold">{project.status.replace(/_/g, " ")}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1C1C1E]">{project.title}</h3>
                  <p className="text-sm text-[#5B5F73] line-clamp-1">
                    {project.mentorId ? "Mentor Assigned" : "Awaiting Mentor Assignment"}
                  </p>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto mt-4 md:mt-0">
                  <div className="text-center w-24">
                    <div className="text-xl font-black text-[#1C1C1E]">{progress}%</div>
                    <div className="text-[10px] text-[#5B5F73] uppercase tracking-wider font-bold">Progress</div>
                  </div>
                  <Link href={`/dashboard/projects/${project.id}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 w-full md:w-auto bg-[#9C7A4C] hover:bg-[#7A6039] text-white">
                    Workspace <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
