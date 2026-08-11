"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Project } from "@/types/project";
import { ProjectActivity } from "@/types/project-activity";
import { Activity } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  project: Project;
}

export default function ActivityTab({ project }: Props) {
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "projectActivities"),
      where("projectId", "==", project.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const acts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProjectActivity));
      setActivities(acts);
      setLoading(false);
    }, (err) => {
      console.error(err);
      toast.error("Failed to load activity");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [project.id]);

  if (loading) return <div className="text-slate-400">Loading timeline...</div>;

  const getActionText = (act: ProjectActivity) => {
    switch (act.action) {
      case "PROJECT_CREATED": return `created the project.`;
      case "MENTOR_ASSIGNED": return `assigned mentor ${(act.metadata?.mentorId as string)?.substring(0, 8) || ""}.`;
      case "TASK_CREATED": return `created task "${act.metadata?.title || 'Unknown'}".`;
      case "TASK_UPDATED": return `updated task "${act.metadata?.title || 'Unknown'}" to ${act.metadata?.status}.`;
      case "TASK_COMPLETED": return `completed task "${act.metadata?.title || 'Unknown'}".`;
      case "MILESTONE_CREATED": return `created milestone "${act.metadata?.title || 'Unknown'}".`;
      case "MILESTONE_COMPLETED": return `completed milestone "${act.metadata?.title || 'Unknown'}".`;
      case "FILE_UPLOADED": return `uploaded file "${act.metadata?.fileName || 'Unknown'}".`;
      case "CHAT_MESSAGE": return `sent a message.`;
      default: return `performed an action: ${act.action}`;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-white mb-6">Activity Timeline</h2>
      
      {activities.length === 0 ? (
        <div className="text-slate-400 bg-slate-900 border border-slate-800 p-8 text-center rounded-lg">
          No activity recorded yet.
        </div>
      ) : (
        <div className="relative border-l border-slate-700 ml-4 space-y-8 pb-4">
          {activities.map(act => (
            <div key={act.id} className="relative pl-6">
              <div className="absolute -left-3.5 top-0 bg-slate-950 border border-slate-700 w-7 h-7 rounded-full flex items-center justify-center text-slate-400">
                <Activity className="w-3 h-3" />
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                <p className="text-sm text-slate-300">
                  <span className="font-bold text-white">{act.actorName}</span> {getActionText(act)}
                </p>
                <div className="text-xs text-slate-500 mt-2">
                  {new Date(act.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
