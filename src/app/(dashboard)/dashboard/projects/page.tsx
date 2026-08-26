"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { Project, ProjectStatus } from "@/types/project";
import { calculateProjectHealth, ProjectHealthStatus, ProjectHealthResult } from "@/lib/utils/project-health";
import { hasAssignedMentor } from "@/lib/utils/project-helpers";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import Link from "next/link";
import { ArrowRight, AlertTriangle, CheckCircle, Clock, Search, FolderOpen, Layers } from "lucide-react";

interface EnrichedProject {
  project: Project;
  health: ProjectHealthResult;
  progress: number;
}

export default function ProjectsDashboardPage() {
  const { currentUser, getIdToken } = useAuth();
  const [projects, setProjects] = useState<EnrichedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_PROGRESS" | "COMPLETED">("ALL");

  useEffect(() => {
    async function loadProjects() {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        let rawProjects: Project[] = [];

        // 1. Attempt API fetch first
        try {
          const token = await getIdToken();
          if (token) {
            const res = await fetch("/api/projects", {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data.projects) && data.projects.length > 0) {
                rawProjects = data.projects;
              }
            }
          }
        } catch {
          // Fall back to client Firestore fetch
        }

        // 2. Direct Firestore Fallback if API returned empty
        if (rawProjects.length === 0) {
          try {
            const pSnap = await getDocs(collection(db, "projects"));
            const allProjects = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
            
            if (currentUser.role === "ADMIN") {
              rawProjects = allProjects;
            } else if (currentUser.role === "STUDENT") {
              rawProjects = allProjects.filter(p => 
                Array.isArray(p.studentIds) && p.studentIds.includes(currentUser.uid)
              );
              // If none mapped directly, show all demo projects for demo students
              if (rawProjects.length === 0 && currentUser.email?.includes("demo")) {
                rawProjects = allProjects;
              }
            } else if (currentUser.role === "MENTOR") {
              rawProjects = allProjects.filter(p => p.mentorId === currentUser.uid || !p.mentorId);
            } else {
              rawProjects = allProjects;
            }
          } catch (err) {
            console.warn("Client Firestore project query warning:", err);
          }
        }

        const loaded = rawProjects.map((p: Project) => {
          const health = calculateProjectHealth(p.updatedAt, now, p.targetCompletionDate, p.progress || 0);
          return { project: p, health, progress: p.progress || 0 };
        });

        loaded.sort((a: EnrichedProject, b: EnrichedProject) => {
          const rank = { STALLED: 0, AT_RISK: 1, ON_TRACK: 2 };
          const rankDiff = rank[a.health.status] - rank[b.health.status];
          if (rankDiff !== 0) return rankDiff;
          return (b.project.updatedAt || 0) - (a.project.updatedAt || 0);
        });

        setProjects(loaded);
      } catch (err) {
        console.error("Failed to load projects", err);
        setError("Failed to load your projects.");
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [currentUser, getIdToken, now]);

  const filteredProjects = useMemo(() => {
    return projects.filter(({ project }) => {
      const matchesSearch = 
        !searchQuery.trim() ||
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = 
        statusFilter === "ALL" ||
        (statusFilter === "IN_PROGRESS" && project.status === ProjectStatus.IN_PROGRESS) ||
        (statusFilter === "COMPLETED" && project.status === ProjectStatus.COMPLETED);

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-4 mt-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  if (error && projects.length === 0) {
    return (
      <div className="max-w-6xl mx-auto mt-12 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#1C1C1E] dark:text-[#F3F4F6] mb-2">Something went wrong</h2>
        <p className="text-[#5B5F73] dark:text-[#9499AD]">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1C1C1E] dark:text-[#F3F4F6] mb-2">Projects</h1>
          <p className="text-[#5B5F73] dark:text-[#9499AD]">
            Manage and track your active collaborations across the SynergyBridge ecosystem.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#EFEDE8] dark:bg-[#141722] p-1 rounded-lg border border-[#5B5F73]/20 dark:border-[#252A3D]">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${statusFilter === "ALL" ? "bg-white dark:bg-[#1E2135] text-[#1C1C1E] dark:text-[#F3F4F6] shadow-sm" : "text-[#5B5F73] dark:text-[#9499AD] hover:text-[#1C1C1E] dark:hover:text-[#F3F4F6]"}`}
          >
            All ({projects.length})
          </button>
          <button
            onClick={() => setStatusFilter("IN_PROGRESS")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${statusFilter === "IN_PROGRESS" ? "bg-white dark:bg-[#1E2135] text-[#1C1C1E] dark:text-[#F3F4F6] shadow-sm" : "text-[#5B5F73] dark:text-[#9499AD] hover:text-[#1C1C1E] dark:hover:text-[#F3F4F6]"}`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter("COMPLETED")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${statusFilter === "COMPLETED" ? "bg-white dark:bg-[#1E2135] text-[#1C1C1E] dark:text-[#F3F4F6] shadow-sm" : "text-[#5B5F73] dark:text-[#9499AD] hover:text-[#1C1C1E] dark:hover:text-[#F3F4F6]"}`}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-[#5B5F73] dark:text-[#9499AD] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects by title, category, domain, or keyword..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#141722] border border-[#9C7A4C]/30 dark:border-[#252A3D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C7A4C] text-[#1C1C1E] dark:text-[#F3F4F6] placeholder:text-[#5B5F73]/60 dark:placeholder:text-[#6D7287]"
        />
      </div>

      {filteredProjects.length === 0 ? (
        <div className="bg-[#EFEDE8] dark:bg-[#141722] border border-[#5B5F73]/20 dark:border-[#252A3D] rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <FolderOpen className="w-16 h-16 text-[#5B5F73]/40 dark:text-[#9499AD]/40 mb-4" />
          <h2 className="text-2xl font-bold text-[#5B5F73] dark:text-[#9499AD] mb-2">No projects match your filter</h2>
          <p className="text-[#5B5F73] dark:text-[#9499AD] max-w-md mx-auto mb-6">
            Try adjusting your search query or status filter to see all active collaborations.
          </p>
          {currentUser?.role === "STUDENT" && (
            <Link href="/explore/problems" className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-[#9C7A4C] hover:bg-[#7A6039] text-white">
              <Search className="w-4 h-4 mr-2" /> Explore Problems
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProjects.map(({ project, health, progress }) => {
            let HealthIcon = CheckCircle;
            let healthColor = "text-emerald-600 dark:text-emerald-400";
            if (health.status === ProjectHealthStatus.AT_RISK) {
              HealthIcon = AlertTriangle;
              healthColor = "text-amber-600 dark:text-amber-400";
            } else if (health.status === ProjectHealthStatus.STALLED) {
              HealthIcon = Clock;
              healthColor = "text-red-600 dark:text-red-400";
            }

            return (
              <Card key={project.id} className="border-[#9C7A4C]/20 hover:border-[#9C7A4C]/40 transition-colors shadow-xs">
                <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`flex items-center text-xs font-bold uppercase ${healthColor}`}>
                        <HealthIcon className="w-3 h-3 mr-1" /> {health.status.replace("_", " ")}
                      </span>
                      <span className="text-[#5B5F73] dark:text-[#9499AD] text-xs">•</span>
                      <span className="text-[#5B5F73] dark:text-[#9499AD] text-xs uppercase font-bold">{project.status.replace(/_/g, " ")}</span>
                      {(project.category || project.domain) && (
                        <>
                          <span className="text-[#5B5F73] dark:text-[#9499AD] text-xs">•</span>
                          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-[#9C7A4C]/10 dark:bg-[#9C7A4C]/20 text-[#9C7A4C] dark:text-[#C4A880] font-semibold">
                            <Layers className="w-3 h-3 mr-1" /> {project.category || project.domain}
                          </span>
                        </>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">{project.title}</h3>
                    
                    {project.description && (
                      <p className="text-sm text-[#5B5F73] dark:text-[#9499AD] mt-1 line-clamp-2 max-w-2xl">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-sm text-[#5B5F73] dark:text-[#9499AD]">
                      {hasAssignedMentor(project) ? (
                        <span>Mentor Assigned</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">Awaiting Mentor</span>
                      )}
                      <span className="text-[#5B5F73]/40">•</span>
                      <span>{project.studentIds?.length || 0} Team Member{(project.studentIds?.length || 0) !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto mt-4 md:mt-0">
                    <div className="text-center w-24">
                      <div className="text-2xl font-black text-[#1C1C1E] dark:text-[#F3F4F6]">{progress}%</div>
                      <div className="text-[10px] text-[#5B5F73] dark:text-[#9499AD] uppercase tracking-wider font-bold">Progress</div>
                    </div>
                    <Link href={`/dashboard/projects/${project.id}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-6 w-full md:w-auto bg-[#9C7A4C] hover:bg-[#7A6039] text-white transition-colors">
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
