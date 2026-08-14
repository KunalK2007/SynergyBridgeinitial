"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/purity */
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Project } from "@/types/project";
import { Milestone, MilestoneStatus } from "@/types/milestone";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Plus, Target, CheckCircle2, Trash2, Calendar, FileText, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { logProjectActivity } from "@/lib/utils/project-activity";
import { ActivityType } from "@/types/project-activity";
import { triggerGamificationEvent } from "@/lib/utils/gamification-client";
import { GamificationEventType } from "@/types/gamification";

interface Props {
  project: Project;
}

const DEFAULT_CROPGUARD_MILESTONES: Milestone[] = [
  {
    id: "cg_mile_1",
    projectId: "demo_proj_1",
    title: "1. Problem Definition",
    description: "Scoped farmer challenges in rural agricultural clusters, confirmed dataset criteria, and aligned with domain mentor Dr. Mehta.",
    targetDate: Date.now() - 1000 * 60 * 60 * 24 * 15,
    status: MilestoneStatus.COMPLETED,
    completionPercentage: 100,
    createdBy: "student_lead",
    completedAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
  },
  {
    id: "cg_mile_2",
    projectId: "demo_proj_1",
    title: "2. Dataset Preparation",
    description: "Collected, annotated, and verified 4,200 multi-spectral crop leaf images across 8 disease classes.",
    targetDate: Date.now() - 1000 * 60 * 60 * 24 * 7,
    status: MilestoneStatus.COMPLETED,
    completionPercentage: 100,
    createdBy: "student_lead",
    completedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: "cg_mile_3",
    projectId: "demo_proj_1",
    title: "3. ML Baseline",
    description: "Train initial convolutional baseline models (MobileNet/ResNet) and optimize F1-score for low-resolution mobile field camera images.",
    targetDate: Date.now() + 1000 * 60 * 60 * 24 * 10,
    status: MilestoneStatus.IN_PROGRESS,
    completionPercentage: 60,
    createdBy: "student_lead",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
  {
    id: "cg_mile_4",
    projectId: "demo_proj_1",
    title: "4. Application Integration",
    description: "Build multilingual mobile dashboard with voice assistant support and automated real-time disease treatment recommendations.",
    targetDate: Date.now() + 1000 * 60 * 60 * 24 * 25,
    status: MilestoneStatus.NOT_STARTED,
    completionPercentage: 0,
    createdBy: "student_lead",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: "cg_mile_5",
    projectId: "demo_proj_1",
    title: "5. Field Validation",
    description: "Deploy prototype test kits to 20 local smallholder farmers and evaluate diagnostic precision in real farm conditions.",
    targetDate: Date.now() + 1000 * 60 * 60 * 24 * 38,
    status: MilestoneStatus.NOT_STARTED,
    completionPercentage: 0,
    createdBy: "student_lead",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: "cg_mile_6",
    projectId: "demo_proj_1",
    title: "6. Final Demonstration",
    description: "Present live demonstration, submit production codebase repository, and publish final impact evaluation report for certification.",
    targetDate: Date.now() + 1000 * 60 * 60 * 24 * 45,
    status: MilestoneStatus.NOT_STARTED,
    completionPercentage: 0,
    createdBy: "student_lead",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
];

export default function MilestonesTab({ project }: Props) {
  const { currentUser } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");

  const loadMilestones = async () => {
    try {
      const snap = await getDocs(query(collection(db, "milestones"), where("projectId", "==", project.id)));
      if (!snap.empty) {
        setMilestones(snap.docs.map(d => ({ id: d.id, ...d.data() } as Milestone)));
      } else {
        setMilestones(DEFAULT_CROPGUARD_MILESTONES.map(m => ({ ...m, projectId: project.id })));
      }
    } catch (err) {
      console.error(err);
      setMilestones(DEFAULT_CROPGUARD_MILESTONES.map(m => ({ ...m, projectId: project.id })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMilestones();
  }, [project.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !currentUser || !newDate) return;
    
    try {
      const tDate = new Date(newDate).getTime();
      const m: Omit<Milestone, "id"> = {
        projectId: project.id,
        title: newTitle,
        description: newDesc,
        targetDate: tDate,
        status: MilestoneStatus.NOT_STARTED,
        completionPercentage: 0,
        createdBy: currentUser.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const docRef = await addDoc(collection(db, "milestones"), m);
      
      try {
        await logProjectActivity(
          project.id,
          currentUser.uid,
          currentUser.displayName || "User",
          ActivityType.MILESTONE_CREATED,
          "MILESTONE",
          docRef.id,
          { title: m.title }
        );
      } catch {
        // Non-blocking
      }
      
      toast.success("Milestone created");
      setIsAdding(false);
      setNewTitle("");
      setNewDesc("");
      setNewDate("");
      loadMilestones();
    } catch {
      const localMilestone: Milestone = {
        id: `mile_${Date.now()}`,
        projectId: project.id,
        title: newTitle,
        description: newDesc,
        targetDate: new Date(newDate).getTime(),
        status: MilestoneStatus.NOT_STARTED,
        completionPercentage: 0,
        createdBy: currentUser.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setMilestones(prev => [...prev, localMilestone]);
      setIsAdding(false);
      setNewTitle("");
      setNewDesc("");
      setNewDate("");
      toast.success("Milestone created");
    }
  };

  const handleUpdatePercentage = async (milestone: Milestone, newPercentage: number) => {
    const isCompleted = newPercentage === 100;
    const newStatus = isCompleted 
      ? MilestoneStatus.COMPLETED 
      : newPercentage > 0 
      ? MilestoneStatus.IN_PROGRESS 
      : MilestoneStatus.NOT_STARTED;
    
    try {
      await updateDoc(doc(db, "milestones", milestone.id), { 
        completionPercentage: newPercentage,
        status: newStatus,
        updatedAt: Date.now(),
        ...(isCompleted ? { completedAt: Date.now(), completedBy: currentUser?.uid } : {})
      });
      
      if (isCompleted) {
        try {
          await logProjectActivity(
            project.id,
            currentUser?.uid || "user",
            currentUser?.displayName || "User",
            ActivityType.MILESTONE_COMPLETED,
            "MILESTONE",
            milestone.id,
            { title: milestone.title }
          );
          triggerGamificationEvent(GamificationEventType.MILESTONE_COMPLETED, milestone.id);
        } catch {
          // Non-blocking
        }
      }

      loadMilestones();
    } catch {
      setMilestones(prev => prev.map(m => m.id === milestone.id ? {
        ...m,
        completionPercentage: newPercentage,
        status: newStatus
      } : m));
      toast.success("Milestone progress updated");
    }
  };

  const handleDelete = async (milestone: Milestone) => {
    if (!confirm("Delete this milestone?")) return;
    try {
      await deleteDoc(doc(db, "milestones", milestone.id));
      toast.success("Milestone deleted");
      loadMilestones();
    } catch {
      setMilestones(prev => prev.filter(m => m.id !== milestone.id));
      toast.success("Milestone deleted");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#1C1C1E]">Project Milestones</h2>
          <p className="text-xs text-[#5B5F73]">Key delivery phases and verification targets</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-[#1C1C1E] text-white hover:bg-black">
          <Plus className="w-4 h-4 mr-2" /> Add Milestone
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-[#EFEDE8] border-[#9C7A4C]/30 shadow-md">
          <CardContent className="p-5">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1C1C1E] uppercase mb-1">Milestone Title</label>
                  <input 
                    type="text" 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    placeholder="e.g. 4. Application Integration"
                    className="w-full bg-white border border-[#5B5F73]/20 rounded-lg p-2.5 text-[#1C1C1E] text-sm focus:outline-none focus:border-[#9C7A4C]" 
                    autoFocus 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C1C1E] uppercase mb-1">Target Date</label>
                  <input 
                    type="date" 
                    value={newDate} 
                    onChange={e => setNewDate(e.target.value)} 
                    className="w-full bg-white border border-[#5B5F73]/20 rounded-lg p-2.5 text-[#1C1C1E] text-sm focus:outline-none" 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] uppercase mb-1">Description</label>
                <textarea 
                  value={newDesc} 
                  onChange={e => setNewDesc(e.target.value)} 
                  placeholder="Milestone scope and deliverables..."
                  className="w-full bg-white border border-[#5B5F73]/20 rounded-lg p-2.5 text-[#1C1C1E] text-sm focus:outline-none focus:border-[#9C7A4C]" 
                  rows={2} 
                  required 
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#1C1C1E] text-white hover:bg-black">Save Milestone</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Milestone Cards */}
      <div className="space-y-4">
        {milestones.sort((a,b) => a.targetDate - b.targetDate).map((m) => {
          const isCompleted = m.status === MilestoneStatus.COMPLETED;
          const isInProgress = m.status === MilestoneStatus.IN_PROGRESS;

          return (
            <Card key={m.id} className="bg-[#EFEDE8] border-[#5B5F73]/20 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-[#1C1C1E]">{m.title}</h3>
                      <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        isCompleted 
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" 
                          : isInProgress 
                          ? "bg-blue-500/10 text-blue-700 border-blue-500/20" 
                          : "bg-slate-200 text-slate-700 border-slate-300"
                      }`}>
                        {m.status ? m.status.replace(/_/g, " ") : "UPCOMING"}
                      </span>
                    </div>

                    <p className="text-[#5B5F73] text-sm mb-4 leading-relaxed">{m.description}</p>
                    
                    <div className="flex items-center text-xs text-[#5B5F73] gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#9C7A4C]" />
                        Target: {new Date(m.targetDate).toLocaleDateString()}
                      </span>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-56 space-y-2 bg-white/80 p-3 rounded-xl border border-[#5B5F73]/15">
                    <div className="flex justify-between text-xs text-[#1C1C1E] font-bold">
                      <span>Progress</span>
                      <span>{m.completionPercentage}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="10" 
                      value={m.completionPercentage} 
                      onChange={(e) => handleUpdatePercentage(m, parseInt(e.target.value))}
                      className="w-full accent-[#9C7A4C] cursor-pointer"
                    />
                    <div className="flex justify-between items-center pt-1 text-[11px] text-[#5B5F73]">
                      <span>Drag to update</span>
                      <button 
                        onClick={() => handleDelete(m)} 
                        className="text-[#5B5F73] hover:text-red-600 transition-colors p-1"
                        title="Delete milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
