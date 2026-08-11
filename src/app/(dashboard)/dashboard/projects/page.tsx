"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { Project } from "@/types/project";
import { calculateProjectHealth, ProjectHealthStatus, ProjectHealthResult } from "@/lib/utils/project-health";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { ArrowRight, AlertTriangle, CheckCircle, Clock, Search, FolderOpen } from "lucide-react";
import toast from "react-hot-toast";

interface EnrichedProject {
  project: Project;
  health: ProjectHealthResult;
  progress: number;
}

export default function ProjectsDashboardPage() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<EnrichedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    async function loadProjects() {
      if (!currentUser) return;
      try {
        const token = await currentUser.uid; // Note: currentUser.uid is the token in this app's mock auth context, or we just pass the uid as token if it handles it. Wait, in standard auth it's getIdToken(). But in this app's useAuth, usually they use the uid directly as the Bearer token for demo. Let's ensure compatibility.
        
        // Wait, looking at other pages: `const token = await user.uid;`
        // See institution analytics page: `const token = await user.uid;`
        const res = await fetch("/api/projects", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const data = await res.json();
        
        const loaded = (data.projects || []).map((p: Project) => {
          const health = calculateProjectHealth(p.updatedAt, now, p.targetCompletionDate, p.progress || 0);
          return { project: p, health, progress: p.progress || 0 };
        });

        // Sort: Needs attention first, then by updated date
        loaded.sort((a: EnrichedProject, b: EnrichedProject) => {
          const rank = { STALLED: 0, AT_RISK: 1, ON_TRACK: 2 };
          const rankDiff = rank[a.health.status] - rank[b.health.status];
          if (rankDiff !== 0) return rankDiff;
          return b.project.updatedAt - a.project.updatedAt;
        });

        setProjects(loaded);
      } catch (err) {
        console.error("Failed to load projects", err);
        setError("Failed to load your projects.");
        toast.error("Failed to load your projects.");
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [currentUser, now]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-4 mt-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto mt-12 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-slate-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Projects</h1>
        <p className="text-slate-400">
          Manage and track your active collaborations across the SynergyBridge ecosystem.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <FolderOpen className="w-16 h-16 text-slate-700 mb-4" />
          <h2 className="text-2xl font-bold text-slate-300 mb-2">No projects yet</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            You don&apos;t have any active or completed projects matching your account role yet. 
            When you join or are assigned to a project, it will appear here.
          </p>
          {currentUser?.role === "STUDENT" && (
            <Link href="/explore/problems" className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Search className="w-4 h-4 mr-2" /> Explore Problems
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {projects.map(({ project, health, progress }) => {
            let HealthIcon = CheckCircle;
            let healthColor = "text-emerald-400";
            if (health.status === ProjectHealthStatus.AT_RISK) {
              HealthIcon = AlertTriangle;
              healthColor = "text-amber-400";
            } else if (health.status === ProjectHealthStatus.STALLED) {
              HealthIcon = Clock;
              healthColor = "text-red-400";
            }

            return (
              <Card key={project.id} className="bg-slate-900 border-indigo-500/30 hover:border-indigo-500/60 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`flex items-center text-xs font-bold uppercase ${healthColor}`}>
                        <HealthIcon className="w-3 h-3 mr-1" /> {health.status.replace("_", " ")}
                      </span>
                      <span className="text-slate-500 text-xs">•</span>
                      <span className="text-slate-400 text-xs uppercase font-bold">{project.status.replace(/_/g, " ")}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{project.title}</h3>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                      {project.mentorId ? (
                         <span>Mentor Assigned</span>
                      ) : (
                         <span className="text-amber-500">Awaiting Mentor</span>
                      )}
                      <span className="text-slate-600">•</span>
                      <span>{project.studentIds.length} Team Member{project.studentIds.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto mt-4 md:mt-0">
                    <div className="text-center w-24">
                      <div className="text-2xl font-black text-white">{progress}%</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Progress</div>
                    </div>
                    <Link href={`/dashboard/projects/${project.id}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-6 w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                      Open Project <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
