"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Project } from "@/types/project";
import { ProjectActivity, ActivityType } from "@/types/project-activity";
import { Activity, CheckCircle2, UserCheck, FolderPlus, MessageSquare, PlusCircle, Sparkles } from "lucide-react";

interface Props {
  project: Project;
}

const DEFAULT_CROPGUARD_ACTIVITIES: ProjectActivity[] = [
  {
    id: "cg_act_1",
    projectId: "demo_proj_1",
    actorId: "student.demo@synergybridge.local",
    actorName: "Aarav Sharma",
    action: ActivityType.TASK_UPDATED,
    entityType: "TASK",
    entityId: "cg_task_3",
    metadata: { title: "Train baseline classification model", status: "IN_PROGRESS" },
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
  },
  {
    id: "cg_act_2",
    projectId: "demo_proj_1",
    actorId: "mentor.demo@synergybridge.local",
    actorName: "Dr. Rahul Mehta",
    action: ActivityType.CHAT_MESSAGE,
    entityType: "MESSAGE",
    metadata: { textPreview: "Great. Before training the baseline model..." },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: "cg_act_3",
    projectId: "demo_proj_1",
    actorId: "student.demo@synergybridge.local",
    actorName: "Aarav Sharma",
    action: ActivityType.MILESTONE_COMPLETED,
    entityType: "MILESTONE",
    entityId: "cg_mile_2",
    metadata: { title: "2. Dataset Preparation" },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: "cg_act_4",
    projectId: "demo_proj_1",
    actorId: "student2.demo@synergybridge.local",
    actorName: "Ananya Patil",
    action: ActivityType.FILE_UPLOADED,
    entityType: "FILE",
    metadata: { fileName: "Disease_Dataset_Summary.xlsx" },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
  {
    id: "cg_act_5",
    projectId: "demo_proj_1",
    actorId: "student.demo@synergybridge.local",
    actorName: "Aarav Sharma",
    action: ActivityType.MILESTONE_COMPLETED,
    entityType: "MILESTONE",
    entityId: "cg_mile_1",
    metadata: { title: "1. Problem Definition" },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
  },
  {
    id: "cg_act_6",
    projectId: "demo_proj_1",
    actorId: "institution.demo@synergybridge.local",
    actorName: "Prof. Vikram Joshi",
    action: ActivityType.MENTOR_ASSIGNED,
    entityType: "PROJECT",
    metadata: { mentorId: "Dr. Rahul Mehta" },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
  },
  {
    id: "cg_act_7",
    projectId: "demo_proj_1",
    actorId: "student.demo@synergybridge.local",
    actorName: "Aarav Sharma",
    action: ActivityType.PROJECT_CREATED,
    entityType: "PROJECT",
    metadata: { title: "CropGuard AI" },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
  },
];

export default function ActivityTab({ project }: Props) {
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "projectActivities"),
      where("projectId", "==", project.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setActivities(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProjectActivity)));
      } else {
        setActivities(DEFAULT_CROPGUARD_ACTIVITIES.map(a => ({ ...a, projectId: project.id })));
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setActivities(DEFAULT_CROPGUARD_ACTIVITIES.map(a => ({ ...a, projectId: project.id })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [project.id]);

  const getActionDetails = (act: ProjectActivity) => {
    switch (act.action as string) {
      case "PROJECT_CREATED":
        return {
          icon: <Sparkles className="w-4 h-4 text-[#9C7A4C]" />,
          text: `initialized and created the project workspace.`,
        };
      case "MENTOR_ASSIGNED":
        return {
          icon: <UserCheck className="w-4 h-4 text-purple-600" />,
          text: `assigned Dr. Rahul Mehta as the domain AI mentor.`,
        };
      case "TASK_CREATED":
        return {
          icon: <PlusCircle className="w-4 h-4 text-blue-600" />,
          text: `created task "${act.metadata?.title || 'Untitled Task'}".`,
        };
      case "TASK_UPDATED":
        return {
          icon: <Activity className="w-4 h-4 text-amber-600" />,
          text: `updated task "${act.metadata?.title || 'Task'}" status to ${act.metadata?.status || 'IN_PROGRESS'}.`,
        };
      case "TASK_COMPLETED":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          text: `completed task "${act.metadata?.title || 'Task'}".`,
        };
      case "MILESTONE_CREATED":
        return {
          icon: <Activity className="w-4 h-4 text-indigo-600" />,
          text: `defined milestone "${act.metadata?.title || 'Milestone'}".`,
        };
      case "MILESTONE_COMPLETED":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          text: `achieved milestone "${act.metadata?.title || 'Milestone'}".`,
        };
      case "FILE_UPLOADED":
        return {
          icon: <FolderPlus className="w-4 h-4 text-blue-600" />,
          text: `uploaded document "${act.metadata?.fileName || 'evidence file'}".`,
        };
      case "CHAT_MESSAGE":
        return {
          icon: <MessageSquare className="w-4 h-4 text-teal-600" />,
          text: `posted mentor advisory message in team chat.`,
        };
      default:
        return {
          icon: <Activity className="w-4 h-4 text-[#5B5F73]" />,
          text: `performed action: ${act.action}`,
        };
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-[#1C1C1E]">Project Activity History</h2>
        <p className="text-xs text-[#5B5F73]">Audit trail of commits, sprint updates, deliverables, and mentor discussions</p>
      </div>
      
      <div className="relative border-l-2 border-[#9C7A4C]/30 ml-4 space-y-6 pb-4">
        {activities.map(act => {
          const { icon, text } = getActionDetails(act);

          return (
            <div key={act.id} className="relative pl-7">
              {/* Timeline Icon Badge */}
              <div className="absolute -left-[17px] top-1 bg-white border-2 border-[#9C7A4C] w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                {icon}
              </div>

              <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-sm text-[#1C1C1E]">
                    {act.actorName}
                  </span>
                  <span className="text-[11px] text-[#5B5F73]">
                    {new Date(act.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <p className="text-sm text-[#5B5F73] leading-relaxed">
                  {text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
