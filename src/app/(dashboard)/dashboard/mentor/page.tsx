"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Project, ProjectStatus } from "@/types/project";
import { MentorProfile } from "@/types/mentor";
import { calculateProjectHealth, ProjectHealthStatus } from "@/lib/utils/project-health";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowRight, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { MentorAnalyticsWidget } from "@/features/analytics/components/MentorAnalyticsWidget";

interface EnrichedProject {
  project: Project;
  health: ReturnType<typeof calculateProjectHealth>;
  progress: number;
}

export default function MentorDashboard() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [projects, setProjects] = useState<EnrichedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    async function load() {
      if (!currentUser || currentUser.role !== "MENTOR") {
        setLoading(false);
        return;
      }
      
      try {
        const pSnap = await getDocs(query(collection(db, "mentors"), where("userId", "==", currentUser.uid)));
        if (!pSnap.empty) {
          setProfile({ id: pSnap.docs[0].id, ...pSnap.docs[0].data() } as MentorProfile);
        }

        const projSnap = await getDocs(query(collection(db, "projects"), where("mentorId", "==", currentUser.uid)));
        const loaded: EnrichedProject[] = [];

        for (const d of projSnap.docs) {
          const p = { id: d.id, ...d.data() } as Project;
          const health = calculateProjectHealth(p.updatedAt, now, p.targetCompletionDate, p.progress || 0);
          loaded.push({ project: p, health, progress: p.progress || 0 });
        }

        loaded.sort((a, b) => {
          const rank = { STALLED: 0, AT_RISK: 1, ON_TRACK: 2 };
          return rank[a.health.status] - rank[b.health.status];
        });

        setProjects(loaded);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser, now]);

  if (loading) return <div className="text-slate-400">Loading mentor dashboard...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Mentor Dashboard</h1>
        <p className="text-slate-400">Monitor your assigned projects and student progress.</p>
      </div>

      <MentorAnalyticsWidget />

      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 uppercase">Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {profile.currentProjectCount} <span className="text-lg text-slate-500">/ {profile.maxActiveProjects}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Active Projects</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 uppercase">Needs Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">
                {projects.filter(p => p.health.status !== ProjectHealthStatus.ON_TRACK).length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Projects At Risk or Stalled</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 uppercase">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-emerald-400">
                {profile.availabilityStatus}
              </div>
              <p className="text-xs text-slate-500 mt-1">Update in Profile Settings</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Active Projects</h2>
        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
              <p className="text-slate-400">You are not currently assigned to any projects.</p>
            </div>
          ) : (
            projects.map(({ project, health, progress }) => {
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
                <Card key={project.id} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`flex items-center text-xs font-bold uppercase ${healthColor}`}>
                          <HealthIcon className="w-3 h-3 mr-1" /> {health.status.replace("_", " ")}
                        </span>
                        <span className="text-slate-500 text-xs">•</span>
                        <span className="text-slate-400 text-xs">Last updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{project.title}</h3>
                      <p className="text-sm text-slate-400 line-clamp-1">{health.reason}</p>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto mt-4 md:mt-0">
                      <div className="text-center w-24">
                        <div className="text-xl font-black text-white">{progress}%</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Progress</div>
                      </div>
                      <Button  className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700">
                        <Link href={`/dashboard/projects/${project.id}`}>
                          Workspace <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
