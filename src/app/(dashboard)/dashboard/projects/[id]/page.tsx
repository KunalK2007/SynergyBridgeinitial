"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Project, ProjectStatus } from "@/types/project";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { 
  LayoutDashboard, 
  MessageSquare, 
  CheckSquare, 
  Target, 
  Folder, 
  Activity, 
  Settings, 
  Bot, 
  BadgeDollarSign, 
  ArrowLeft,
  Calendar,
  Loader2
} from "lucide-react";
import KanbanBoard from "./components/KanbanBoard";
import ChatTab from "./components/ChatTab";
import MilestonesTab from "./components/MilestonesTab";
import FilesTab from "./components/FilesTab";
import ActivityTab from "./components/ActivityTab";
import OverviewTab from "./components/OverviewTab";
import AIMentorTab from "./components/AIMentorTab";
import FundingTab from "./components/FundingTab";

const DEMO_PROJECT_FALLBACKS: Record<string, Partial<Project>> = {
  demo_proj_1: {
    title: "CropGuard AI",
    category: "Agriculture & AI",
    domain: "Agriculture",
    description: "AI-assisted crop monitoring that helps identify crop stress and potential disease using image-based analysis.",
    status: ProjectStatus.IN_PROGRESS,
    progress: 45,
    keyObjective: "Develop an edge-deployable deep learning model with >90% precision for early blight and rust detection, integrated with a local language mobile advisory dashboard for farmers.",
    problemId: "demo_prob_1",
    applicationId: "demo_app_1"
  },
  demo_proj_2: {
    title: "AquaSense",
    category: "Sustainability & IoT",
    domain: "Sustainability",
    description: "An IoT-based water monitoring platform designed to detect abnormal consumption and reduce water waste.",
    status: ProjectStatus.IN_PROGRESS,
    progress: 60,
    keyObjective: "Deploy smart flow meters and anomaly detection algorithms to identify underground pipeline leaks in real-time.",
    problemId: "demo_prob_2",
    applicationId: "demo_app_2"
  },
  demo_proj_3: {
    title: "MediRoute",
    category: "Healthcare Technology",
    domain: "Healthcare",
    description: "A smart appointment and patient-routing platform designed to reduce waiting times in community clinics.",
    status: ProjectStatus.IN_PROGRESS,
    progress: 35,
    keyObjective: "Streamline patient triage and appointment slot allocations through predictive patient load scheduling.",
    problemId: "demo_prob_3",
    applicationId: "demo_app_3"
  },
  demo_proj_4: {
    title: "EduBridge",
    category: "Education Technology",
    domain: "Education",
    description: "An adaptive learning platform that helps students identify knowledge gaps and access personalized learning resources.",
    status: ProjectStatus.ALLOCATED,
    progress: 20,
    keyObjective: "Build knowledge-graph driven adaptive learning paths tailored to engineering student skill requirements.",
    problemId: "demo_prob_4",
    applicationId: "demo_app_4"
  },
  demo_proj_5: {
    title: "SolarTrack",
    category: "Clean Energy",
    domain: "Clean Energy",
    description: "A solar monitoring solution that tracks energy generation, equipment performance, and maintenance requirements.",
    status: ProjectStatus.IN_PROGRESS,
    progress: 50,
    keyObjective: "Optimize solar photovoltaic array output and forecast equipment degradation using IoT telemetry.",
    problemId: "demo_prob_4",
    applicationId: "demo_app_5"
  },
  demo_proj_6: {
    title: "SafeTransit",
    category: "Mobility & AI",
    domain: "Mobility",
    description: "A predictive transit safety platform that identifies potentially hazardous traffic conditions using aggregated mobility data.",
    status: ProjectStatus.IN_PROGRESS,
    progress: 70,
    keyObjective: "Implement computer vision accident hazard prediction algorithms on urban traffic camera streams.",
    problemId: "demo_prob_2",
    applicationId: "demo_app_6"
  },
  demo_proj_7: {
    title: "WasteWise",
    category: "Sustainability",
    domain: "Sustainability",
    description: "A waste classification and collection optimization system designed to improve recycling efficiency.",
    status: ProjectStatus.COMPLETED,
    progress: 100,
    keyObjective: "Automate municipal solid waste sorting using optical sensors and route optimization for collection vehicles.",
    problemId: "demo_prob_1",
    applicationId: "demo_app_7"
  },
  demo_proj_8: {
    title: "SkillMatch",
    category: "Career Technology",
    domain: "Career Tech",
    description: "A skills-based platform connecting learners with suitable projects, mentors, and practical opportunities.",
    status: ProjectStatus.COMPLETED,
    progress: 100,
    keyObjective: "Match multi-disciplinary student teams to complex engineering problem statements using semantic embeddings.",
    problemId: "demo_prob_3",
    applicationId: "demo_app_8"
  }
};

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
      const projId = id as string;
      try {
        const pSnap = await getDoc(doc(db, "projects", projId));
        if (!pSnap.exists()) {
          // If demo project fallback exists
          const fallback = DEMO_PROJECT_FALLBACKS[projId] || (projId.includes("demo") ? DEMO_PROJECT_FALLBACKS.demo_proj_1 : null);
          if (fallback) {
            const now = Date.now();
            setProject({
              id: projId,
              problemId: fallback.problemId || "demo_prob_1",
              applicationId: fallback.applicationId || "demo_app_1",
              studentIds: [currentUser.uid, "synthetic_student_2"],
              mentorId: "mentor_demo_uid",
              title: fallback.title || "CropGuard AI",
              description: fallback.description || "AI-assisted crop monitoring that helps identify crop stress and potential disease using image-based analysis.",
              category: fallback.category || "Agriculture & AI",
              domain: fallback.domain || "Agriculture",
              keyObjective: fallback.keyObjective || "Deliver AI-assisted precision monitoring solution.",
              status: fallback.status || ProjectStatus.IN_PROGRESS,
              progress: fallback.progress || 45,
              startDate: now - 1000 * 60 * 60 * 24 * 20,
              targetCompletionDate: now + 1000 * 60 * 60 * 24 * 45,
              createdAt: now - 1000 * 60 * 60 * 24 * 20,
              updatedAt: now,
            });
            setLoading(false);
            return;
          }
          router.push("/dashboard");
          return;
        }
        
        const projData = pSnap.data();
        const proj = { 
          id: pSnap.id, 
          ...projData,
          title: projData.title || "CropGuard AI",
          description: projData.description || "AI-assisted crop monitoring that helps identify crop stress and potential disease using image-based analysis.",
          category: projData.category || "Agriculture & AI",
        } as Project;
        
        setProject(proj);
      } catch (err) {
        console.error("Error loading project workspace:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, currentUser, router]);

  if (loading) {
    return (
      <div className="py-24 text-center text-[#5B5F73]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#9C7A4C]" />
        <p className="text-base font-medium">Loading project workspace...</p>
      </div>
    );
  }

  if (!project) return null;

  const canAssignMentor = currentUser?.role === "ADMIN" || currentUser?.role === "FACULTY";
  const isParticipant = 
    project.studentIds?.includes(currentUser?.uid || "") || 
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
    <div className="max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-8rem)] space-y-6">
      {/* Top Breadcrumb / Back Navigation */}
      <div className="flex items-center gap-2 text-sm text-[#5B5F73]">
        <Link href="/dashboard" className="hover:text-[#1C1C1E] transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <span>/</span>
        <Link href="/dashboard/projects" className="hover:text-[#1C1C1E] transition-colors">
          Active Projects
        </Link>
        <span>/</span>
        <span className="text-[#1C1C1E] font-medium truncate max-w-xs">{project.title}</span>
      </div>

      {/* Header */}
      <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-[#9C7A4C]/15 text-[#9C7A4C] text-xs font-bold uppercase tracking-wider">
                {project.category || "Agriculture & AI"}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                {project.status ? project.status.replace(/_/g, " ") : "ACTIVE"}
              </span>
              {project.targetCompletionDate && (
                <span className="text-xs text-[#5B5F73] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Target: {new Date(project.targetCompletionDate).toLocaleDateString()}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#1C1C1E]">
              {project.title}
            </h1>

            <p className="text-sm text-[#5B5F73] max-w-3xl">
              {project.description || "An AI-assisted crop monitoring platform that helps farmers identify crop stress and potential disease earlier using image-based analysis."}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {canAssignMentor && (
              <Button onClick={() => router.push(`/dashboard/projects/${project.id}/assign-mentor`)} variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" /> Manage Mentor
              </Button>
            )}
            <div className="text-right hidden sm:block bg-white/70 px-4 py-2 rounded-xl border border-[#5B5F73]/15">
              <div className="text-xs font-semibold text-[#5B5F73] uppercase tracking-wider">Progress</div>
              <div className="text-2xl font-black text-[#1C1C1E]">{project.progress || 45}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="border-b border-[#5B5F73]/20 overflow-x-auto custom-scrollbar">
        <div className="flex gap-2 min-w-max pb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  isActive
                    ? tab.id === "AI_MENTOR"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-[#1C1C1E] text-white shadow-sm"
                    : "text-[#5B5F73] hover:text-[#1C1C1E] hover:bg-[#EFEDE8]/80"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 pb-12">
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
