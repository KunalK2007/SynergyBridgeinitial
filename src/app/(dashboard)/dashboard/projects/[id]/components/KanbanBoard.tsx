"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Project } from "@/types/project";
import { Task, TaskStatus, TaskPriority } from "@/types/task";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Plus, MoreVertical, Trash2, Edit2, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { logProjectActivity } from "@/lib/utils/project-activity";
import { ActivityType } from "@/types/project-activity";
import { triggerGamificationEvent } from "@/lib/utils/gamification-client";
import { GamificationEventType } from "@/types/gamification";

interface Props {
  project: Project;
}

export default function KanbanBoard({ project }: Props) {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple modal state
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");

  const loadTasks = async () => {
    try {
      const snap = await getDocs(query(collection(db, "tasks"), where("projectId", "==", project.id)));
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks();
  }, [project.id]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !currentUser) return;
    
    try {
      const t: Omit<Task, "id"> = {
        projectId: project.id,
        title: newTaskTitle,
        description: newTaskDesc,
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        createdBy: currentUser.uid,
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime()
      };
      
      const docRef = await addDoc(collection(db, "tasks"), t);
      
      await logProjectActivity(project.id, currentUser.uid, currentUser.displayName || "User", ActivityType.TASK_CREATED, "TASK", docRef.id, { title: t.title });
      
      toast.success("Task created");
      setIsAdding(false);
      setNewTaskTitle("");
      setNewTaskDesc("");
      loadTasks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create task");
    }
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await updateDoc(doc(db, "tasks", task.id), { 
        status: newStatus, 
        updatedAt: new Date().getTime(),
        ...(newStatus === TaskStatus.DONE ? { completedAt: new Date().getTime() } : {})
      });
      
      if (newStatus === TaskStatus.DONE) {
        await logProjectActivity(project.id, currentUser!.uid, currentUser!.displayName || "User", ActivityType.TASK_COMPLETED, "TASK", task.id, { title: task.title });
        triggerGamificationEvent(GamificationEventType.TASK_COMPLETED, task.id);
      } else {
        await logProjectActivity(project.id, currentUser!.uid, currentUser!.displayName || "User", ActivityType.TASK_UPDATED, "TASK", task.id, { title: task.title, status: newStatus });
      }

      loadTasks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (task: Task) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteDoc(doc(db, "tasks", task.id));
      toast.success("Task deleted");
      loadTasks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task");
    }
  };

  if (loading) return <div className="text-slate-400">Loading tasks...</div>;

  const columns = [
    { id: TaskStatus.TODO, label: "TODO", color: "bg-slate-800" },
    { id: TaskStatus.IN_PROGRESS, label: "IN PROGRESS", color: "bg-blue-900/30 border border-blue-800" },
    { id: TaskStatus.REVIEW, label: "REVIEW", color: "bg-purple-900/30 border border-purple-800" },
    { id: TaskStatus.DONE, label: "DONE", color: "bg-emerald-900/30 border border-emerald-800" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Project Tasks</h2>
        <Button onClick={() => setIsAdding(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-slate-900 border-indigo-500/50">
          <CardContent className="p-4">
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Title</label>
                <input 
                  type="text" 
                  value={newTaskTitle} 
                  onChange={e => setNewTaskTitle(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description (Optional)</label>
                <textarea 
                  value={newTaskDesc} 
                  onChange={e => setNewTaskDesc(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Save Task</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          
          return (
            <div key={col.id} className={`rounded-xl p-3 ${col.color}`}>
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-sm font-bold text-slate-300">{col.label}</h3>
                <span className="bg-slate-950 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>
              
              <div className="space-y-3 min-h-[100px]">
                {colTasks.map(task => (
                  <Card key={task.id} className="bg-slate-950 border-slate-800 hover:border-slate-700 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm text-white">{task.title}</h4>
                        
                        {/* Status Action Dropdown replacement for MVP - just a native select */}
                        <select 
                          className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 rounded px-1 py-0.5 ml-2 cursor-pointer focus:outline-none"
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="REVIEW">Review</option>
                          <option value="DONE">Done</option>
                        </select>
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
                      )}
                      
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/50">
                        <div className="flex gap-2 items-center">
                           <span className="w-5 h-5 rounded-full bg-indigo-900 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                             {task.priority.charAt(0)}
                           </span>
                        </div>
                        <button onClick={() => handleDelete(task)} className="text-slate-600 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
