"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Project } from "@/types/project";
import { Milestone, MilestoneStatus } from "@/types/milestone";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { AlertCircle, Clock, Plus, Target, Check, Trash2, Calendar, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { logProjectActivity } from "@/lib/utils/project-activity";
import { ActivityType } from "@/types/project-activity";
import { triggerGamificationEvent } from "@/lib/utils/gamification-client";
import { GamificationEventType } from "@/types/gamification";

const getCurrentTime = () => Date.now();

interface Props {
  project: Project;
}

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
      setMilestones(snap.docs.map(d => ({ id: d.id, ...d.data() } as Milestone)));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load milestones");
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
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime()
      };
      
      const docRef = await addDoc(collection(db, "milestones"), m);
      
      await logProjectActivity(project.id, currentUser.uid, currentUser.displayName || "User", ActivityType.MILESTONE_CREATED, "MILESTONE", docRef.id, { title: m.title });
      
      toast.success("Milestone created");
      setIsAdding(false);
      setNewTitle("");
      setNewDesc("");
      setNewDate("");
      loadMilestones();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create milestone");
    }
  };

  const handleUpdatePercentage = async (milestone: Milestone, newPercentage: number) => {
    const isCompleted = newPercentage === 100;
    const newStatus = isCompleted ? MilestoneStatus.COMPLETED : MilestoneStatus.IN_PROGRESS;
    
    try {
      await updateDoc(doc(db, "milestones", milestone.id), { 
        completionPercentage: newPercentage,
        status: newStatus,
        updatedAt: getCurrentTime(),
        ...(isCompleted ? { completedAt: getCurrentTime(), completedBy: currentUser?.uid } : {})
      });
      
      if (isCompleted) {
        await logProjectActivity(project.id, currentUser!.uid, currentUser!.displayName || "User", ActivityType.MILESTONE_COMPLETED, "MILESTONE", milestone.id, { title: milestone.title });
        triggerGamificationEvent(GamificationEventType.MILESTONE_COMPLETED, milestone.id);
      }

      loadMilestones();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update milestone");
    }
  };

  const handleDelete = async (milestone: Milestone) => {
    if (!confirm("Delete this milestone?")) return;
    try {
      await deleteDoc(doc(db, "milestones", milestone.id));
      toast.success("Milestone deleted");
      loadMilestones();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete milestone");
    }
  };

  if (loading) return <div className="text-slate-400">Loading milestones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Project Milestones</h2>
        <Button onClick={() => setIsAdding(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> Add Milestone
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-slate-900 border-indigo-500/50">
          <CardContent className="p-4">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Title</label>
                  <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm" autoFocus required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Target Date</label>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm" rows={2} required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Save Milestone</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {milestones.length === 0 ? (
          <div className="text-slate-400 bg-slate-900 border border-slate-800 p-8 text-center rounded-lg">
            No milestones defined yet.
          </div>
        ) : (
          milestones.sort((a,b) => a.targetDate - b.targetDate).map(m => (
            <Card key={m.id} className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{m.title}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        m.status === MilestoneStatus.COMPLETED ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800" :
                        m.status === MilestoneStatus.IN_PROGRESS ? "bg-blue-900/30 text-blue-400 border border-blue-800" :
                        "bg-slate-800 text-slate-300"
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-4">{m.description}</p>
                    <div className="flex items-center text-xs text-slate-500 gap-4">
                      <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> Target: {new Date(m.targetDate).toLocaleDateString()}</span>
                      {m.evidenceFileId && <span className="flex items-center text-indigo-400"><FileText className="w-3 h-3 mr-1" /> Evidence Uploaded</span>}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-48 space-y-2">
                    <div className="flex justify-between text-xs text-slate-400 font-semibold mb-1">
                      <span>Progress</span>
                      <span>{m.completionPercentage}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" step="10" 
                      value={m.completionPercentage} 
                      onChange={(e) => handleUpdatePercentage(m, parseInt(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                    <div className="flex justify-end pt-2">
                      <button onClick={() => handleDelete(m)} className="text-slate-600 hover:text-red-400 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
