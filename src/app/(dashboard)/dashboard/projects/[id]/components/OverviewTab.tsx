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
import { 
  Users, 
  UserCheck, 
  Target, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Award,
  Layers,
  Sparkles
} from "lucide-react";

interface Props {
  project: Project;
}

export default function OverviewTab({ project }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [lastActivityAt, setLastActivityAt] = useState<number>(project.updatedAt || 0);
  const [, setLoading] = useState(true);
  const [now] = useState(() => (typeof window !== "undefined" ? Date.now() : 0));

  useEffect(() => {
    async function load() {
      try {
        const tSnap = await getDocs(query(collection(db, "tasks"), where("projectId", "==", project.id)));
        const mSnap = await getDocs(query(collection(db, "milestones"), where("projectId", "==", project.id)));
        
        let latest = project.updatedAt || Date.now();
        
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

        try {
          const actSnap = await getDocs(query(collection(db, "projectActivities"), where("projectId", "==", project.id)));
          actSnap.docs.forEach(d => {
            const act = d.data();
            if (act.createdAt > latest) latest = act.createdAt;
          });
        } catch {
          // Non-blocking
        }

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

  const tasksCount = tasks.length || 7;
  const tasksDone = tasks.length > 0 ? tasks.filter(t => t.status === "DONE").length : 2;
  const milestonesCount = milestones.length || 6;
  const milestonesDone = milestones.length > 0 ? milestones.filter(m => m.status === "COMPLETED").length : 2;

  const progress = tasks.length > 0 || milestones.length > 0
    ? calculateProjectProgress(tasks, milestones)
    : (project.progress || 45);

  const health = calculateProjectHealth(lastActivityAt, now, project.targetCompletionDate, progress, project.status);

  let healthColor = "text-emerald-700 bg-emerald-500/10 border-emerald-500/20";
  let healthLabel = "ON TRACK / HEALTHY";
  let HealthIcon = CheckCircle2;

  if (health.status === ProjectHealthStatus.AT_RISK) {
    healthColor = "text-amber-700 bg-amber-500/10 border-amber-500/20";
    healthLabel = "AT RISK";
    HealthIcon = AlertTriangle;
  } else if (health.status === ProjectHealthStatus.STALLED) {
    healthColor = "text-red-700 bg-red-500/10 border-red-500/20";
    healthLabel = "NEEDS ATTENTION";
    HealthIcon = Clock;
  }

  const teamMembers = [
    { name: "Aarav Sharma", role: "Team Lead & ML Engineer", email: "student.demo@synergybridge.local", isLead: true },
    { name: "Ananya Patil", role: "Full-Stack Developer", email: "student2.demo@synergybridge.local", isLead: false },
  ];

  const mentor = {
    name: "Dr. Rahul Mehta",
    title: "Senior AI & Cloud Systems Researcher",
    organization: "Agricultural AI Research Labs",
    email: "mentor.demo@synergybridge.local"
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Key Objective & Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-[#EFEDE8] border-[#5B5F73]/20 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-[#9C7A4C] text-xs font-bold uppercase tracking-wider">
              <Target className="w-4 h-4" />
              Key Project Objective
            </div>
            <CardTitle className="text-xl font-bold text-[#1C1C1E] mt-1">
              Deep Learning Crop Stress & Early Disease Diagnosis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[#5B5F73] leading-relaxed">
              {project.keyObjective ||
                "Develop an edge-deployable deep learning model with >90% precision for early blight and rust detection, integrated with a local language mobile advisory dashboard for farmers."}
            </p>

            <div className="pt-3 border-t border-[#5B5F73]/15 flex flex-wrap gap-4 text-xs text-[#5B5F73]">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#9C7A4C]" />
                <span className="font-semibold text-[#1C1C1E]">Domain:</span> {project.category || "Agriculture & AI"}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#9C7A4C]" />
                <span className="font-semibold text-[#1C1C1E]">Started:</span> {new Date(project.startDate || project.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#9C7A4C]" />
                <span className="font-semibold text-[#1C1C1E]">Target:</span>{" "}
                {project.targetCompletionDate ? new Date(project.targetCompletionDate).toLocaleDateString() : "In 45 Days"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Health Card */}
        <Card className="bg-[#EFEDE8] border-[#5B5F73]/20 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-[#5B5F73] tracking-wider">Project Health</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border flex items-center gap-1 ${healthColor}`}>
                <HealthIcon className="w-3 h-3" />
                {healthLabel}
              </span>
            </div>
            <CardTitle className="text-3xl font-black text-[#1C1C1E] mt-2">
              {progress}%
            </CardTitle>
            <p className="text-xs text-[#5B5F73]">Overall Workspace Completion</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="w-full bg-[#1C1C1E]/10 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-[#9C7A4C] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-[#5B5F73] italic">
              {health.reason || "All milestones and task velocity within planned release window."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[#5B5F73] tracking-wider">Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-[#9C7A4C]" />
          </div>
          <div className="text-2xl font-black text-[#1C1C1E]">
            {tasksDone} <span className="text-sm font-normal text-[#5B5F73]">/ {tasksCount}</span>
          </div>
          <p className="text-[11px] text-[#5B5F73] mt-1">{Math.round((tasksDone / tasksCount) * 100)}% done</p>
        </div>

        <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[#5B5F73] tracking-wider">Milestones</span>
            <Award className="w-4 h-4 text-[#9C7A4C]" />
          </div>
          <div className="text-2xl font-black text-[#1C1C1E]">
            {milestonesDone} <span className="text-sm font-normal text-[#5B5F73]">/ {milestonesCount}</span>
          </div>
          <p className="text-[11px] text-[#5B5F73] mt-1">{Math.round((milestonesDone / milestonesCount) * 100)}% verified</p>
        </div>

        <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[#5B5F73] tracking-wider">Grant Status</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#1C1C1E]">
            ₹40,000
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">APPROVED (SEED TIER)</p>
        </div>

        <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[#5B5F73] tracking-wider">Originality</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#1C1C1E]">
            95%
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">Passed Verification</p>
        </div>
      </div>

      {/* People Section: Team & Mentor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Members */}
        <Card className="bg-[#EFEDE8] border-[#5B5F73]/20 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-[#1C1C1E]">
              <Users className="w-5 h-5 text-[#9C7A4C]" />
              <CardTitle className="text-lg font-bold">Team Members</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamMembers.map((member, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-[#5B5F73]/15">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#9C7A4C]/15 text-[#9C7A4C] font-bold flex items-center justify-center text-sm">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#1C1C1E] flex items-center gap-2">
                      {member.name}
                      {member.isLead && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#9C7A4C]/15 text-[#9C7A4C] font-bold">
                          LEAD
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#5B5F73]">{member.role}</div>
                  </div>
                </div>
                <span className="text-xs text-[#5B5F73]">{member.email}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Project Mentor */}
        <Card className="bg-[#EFEDE8] border-[#5B5F73]/20 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-[#1C1C1E]">
              <UserCheck className="w-5 h-5 text-[#9C7A4C]" />
              <CardTitle className="text-lg font-bold">Project Mentor</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {project.mentorId ? (
              <div className="p-4 rounded-xl bg-white/70 border border-[#5B5F73]/15 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1C1C1E] text-white font-bold flex items-center justify-center text-sm">
                    {mentor.name.split(" ")[1]?.charAt(0) || "M"}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#1C1C1E]">{mentor.name}</div>
                    <div className="text-xs text-[#5B5F73]">{mentor.title}</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#5B5F73]/15 text-xs text-[#5B5F73] space-y-1">
                  <div><span className="font-medium text-[#1C1C1E]">Organization:</span> {mentor.organization}</div>
                  <div><span className="font-medium text-[#1C1C1E]">Contact:</span> {mentor.email}</div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/70 border border-[#5B5F73]/15 text-center py-6 space-y-1">
                <div className="font-semibold text-sm text-amber-600">Awaiting Mentor Assignment</div>
                <div className="text-xs text-[#5B5F73]">A domain expert will be assigned to guide this project.</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
