"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Project } from "@/types/project";
import { Task } from "@/types/task";
import { Milestone } from "@/types/milestone";
import { calculateProjectProgress } from "@/lib/utils/project-progress";
import { calculateProjectHealth, ProjectHealthStatus } from "@/lib/utils/project-health";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface Props {
  project: Project;
}

export default function OverviewTab({ project }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [lastActivityAt, setLastActivityAt] = useState<number>(project.updatedAt);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    async function load() {
      try {
        const tSnap = await getDocs(query(collection(db, "tasks"), where("projectId", "==", project.id)));
        const mSnap = await getDocs(query(collection(db, "milestones"), where("projectId", "==", project.id)));
        
        // Find latest activity to calculate health
        // Simplest approximation: check latest task/milestone update or project updated
        let latest = project.updatedAt;
        
        const loadedTasks = tSnap.docs.map(d => {
          const t = { id: d.id, ...d.data() } as Task;
          if (t.updatedAt > latest) latest = t.updatedAt;
          return t;
        });
        
        const loadedMilestones = mSnap.docs.map(d => {
          const m = { id: d.id, ...d.data() } as Milestone;
          if (m.updatedAt > latest) latest = m.updatedAt;
          return m;
        });

        // We could also query `projectActivities` for true latest, but tasks/milestones usually cover it well enough for overview unless chat is active.
        const actSnap = await getDocs(query(collection(db, "projectActivities"), where("projectId", "==", project.id)));
        actSnap.docs.forEach(d => {
          const act = d.data();
          if (act.createdAt > latest) latest = act.createdAt;
        });

        setTasks(loadedTasks);
        setMilestones(loadedMilestones);
        setLastActivityAt(latest);
      } catch (err) {
        console.error("Failed to load overview data", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [project.id, project.updatedAt]);

  if (loading) return <div className="text-slate-400">Loading overview...</div>;

  const progress = calculateProjectProgress(tasks, milestones);
  const health = calculateProjectHealth(lastActivityAt, now, project.targetCompletionDate, progress);

  let healthColor = "text-emerald-400";
  if (health.status === ProjectHealthStatus.AT_RISK) healthColor = "text-amber-400";
  if (health.status === ProjectHealthStatus.STALLED) healthColor = "text-red-400";

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className={`text-3xl font-black ${healthColor}`}>
              {health.status.replace("_", " ")}
            </div>
            <p className="text-slate-400 text-sm mt-1">{health.reason}</p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300 font-semibold">Overall Progress</span>
              <span className="text-white font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3">
              <div 
                className="bg-indigo-500 h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metrics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <div className="text-sm text-slate-400 font-semibold mb-1">Tasks</div>
            <div className="text-2xl font-bold text-white">
              {tasks.filter(t => t.status === "DONE").length} / {tasks.length}
            </div>
          </div>
          
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <div className="text-sm text-slate-400 font-semibold mb-1">Milestones</div>
            <div className="text-2xl font-bold text-white">
              {milestones.filter(m => m.status === "COMPLETED").length} / {milestones.length}
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 col-span-2">
            <div className="text-sm text-slate-400 font-semibold mb-1">Target Deadline</div>
            <div className="text-lg font-bold text-white">
              {project.targetCompletionDate 
                ? new Date(project.targetCompletionDate).toLocaleDateString()
                : "Not set"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
