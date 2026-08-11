"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Project } from "@/types/project";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { LayoutDashboard, MessageSquare, CheckSquare, Target, Folder, Activity, Settings, Bot } from "lucide-react";
import KanbanBoard from "./components/KanbanBoard";
import ChatTab from "./components/ChatTab";
import MilestonesTab from "./components/MilestonesTab";
import FilesTab from "./components/FilesTab";
import ActivityTab from "./components/ActivityTab";
import OverviewTab from "./components/OverviewTab";
import AIMentorTab from "./components/AIMentorTab";
import FundingTab from "./components/FundingTab";
import { BadgeDollarSign } from "lucide-react";

export default function ProjectWorkspace() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("OVERVIEW");

  useEffect(() => {
    async function load() {
      if (!currentUser || !id) return;
      try {
        const pSnap = await getDoc(doc(db, "projects", id as string));
        if (!pSnap.exists()) {
          router.push("/dashboard");
          return;
        }
        
        const proj = { id: pSnap.id, ...pSnap.data() } as Project;
        
        // Authorization is enforced by firestore rules, but we do a fast client check
        const isParticipant = 
          proj.studentIds.includes(currentUser.uid) || 
          proj.mentorId === currentUser.uid || 
          proj.coordinatorId === currentUser.uid || 
          currentUser.role === "ADMIN";

        // Since we can't easily check posterId syncly without another fetch, we just allow the page to render.
        // If they are unauthorized, sub-components will fail gracefully due to rules.
        
        setProject(proj);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, currentUser, router]);

  if (loading) return <div className="p-8 text-slate-400">Loading workspace...</div>;
  if (!project) return null;

  const canAssignMentor = currentUser?.role === "ADMIN" || currentUser?.role === "FACULTY";
  const isParticipant = 
    project.studentIds.includes(currentUser?.uid || "") || 
    project.mentorId === currentUser?.uid || 
    project.coordinatorId === currentUser?.uid || 
    currentUser?.role === "ADMIN";

  const tabs = [
    { id: "OVERVIEW", label: "Overview", icon: LayoutDashboard },
    { id: "TASKS", label: "Tasks", icon: CheckSquare },
    { id: "MILESTONES", label: "Milestones", icon: Target },
    { id: "CHAT", label: "Chat", icon: MessageSquare },
    { id: "FILES", label: "Files", icon: Folder },
    { id: "ACTIVITY", label: "Activity", icon: Activity },
    { id: "FUNDING", label: "Funding", icon: BadgeDollarSign },
    ...(isParticipant ? [{ id: "AI_MENTOR", label: "AI Mentor", icon: Bot }] : []),
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex-none mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{project.title}</h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-xs font-bold uppercase text-slate-300">
                {project.status}
              </span>
              {!project.mentorId && (
                <span className="text-amber-400 text-sm">No Mentor Assigned</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {canAssignMentor && (
              <Button onClick={() => router.push(`/dashboard/projects/${project.id}/assign-mentor`)} variant="outline">
                <Settings className="w-4 h-4 mr-2" /> Manage Mentor
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Nav */}
      <div className="flex-none border-b border-slate-800 mb-6 overflow-x-auto custom-scrollbar">
        <div className="flex gap-6 min-w-max px-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id 
                  ? tab.id === "AI_MENTOR" ? "border-purple-500 text-purple-400" : "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-12">
        {activeTab === "OVERVIEW" && <OverviewTab project={project} />}
        {activeTab === "TASKS" && <KanbanBoard project={project} />}
        {activeTab === "MILESTONES" && <MilestonesTab project={project} />}
        {activeTab === "CHAT" && <ChatTab project={project} />}
        {activeTab === "FILES" && <FilesTab project={project} />}
        {activeTab === "ACTIVITY" && <ActivityTab project={project} />}
        {activeTab === "FUNDING" && <FundingTab project={project} />}
        {activeTab === "AI_MENTOR" && <AIMentorTab project={project} />}
      </div>
    </div>
  );
}
