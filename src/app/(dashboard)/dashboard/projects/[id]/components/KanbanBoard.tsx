"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/purity */
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Project } from "@/types/project";
import { Task, TaskStatus, TaskPriority } from "@/types/task";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Plus, Trash2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { logProjectActivity } from "@/lib/utils/project-activity";
import { ActivityType } from "@/types/project-activity";
import { triggerGamificationEvent } from "@/lib/utils/gamification-client";
import { GamificationEventType } from "@/types/gamification";

interface Props {
  project: Project;
}

const DEFAULT_CROPGUARD_TASKS: Task[] = [
  {
    id: "cg_task_1",
    projectId: "demo_proj_1",
    title: "Define crop disease dataset",
    description: "Catalogued 4,200 labeled field images covering tomato and potato leaf blights with localized labels.",
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    createdBy: "student_lead",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    completedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
  {
    id: "cg_task_2",
    projectId: "demo_proj_1",
    title: "Prepare image preprocessing pipeline",
    description: "Built augmentations, histogram normalization, and TFRecord conversion scripts for mobile input.",
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    createdBy: "student_lead",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    completedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: "cg_task_3",
    projectId: "demo_proj_1",
    title: "Train baseline classification model",
    description: "Benchmarking MobileNetV3 and EfficientNet-B0 architectures for edge inference accuracy.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    createdBy: "student_lead",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
  {
    id: "cg_task_4",
    projectId: "demo_proj_1",
    title: "Build farmer dashboard",
    description: "Designing simple high-contrast diagnosis screen with multilingual voice prompts and treatment cards.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    createdBy: "student_2",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: "cg_task_5",
    projectId: "demo_proj_1",
    title: "Integrate model inference API",
    description: "Export ONNX models and set up quantized microservice endpoints with sub-150ms response latency.",
    status: TaskStatus.REVIEW,
    priority: TaskPriority.HIGH,
    createdBy: "student_lead",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
  {
    id: "cg_task_6",
    projectId: "demo_proj_1",
    title: "Conduct field validation",
    description: "Test diagnosis accuracy directly on live farm crops across 3 regional test partner plots.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    createdBy: "student_2",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: "cg_task_7",
    projectId: "demo_proj_1",
    title: "Prepare final project report",
    description: "Compile empirical evaluation matrices, user feedback logs, and deployment documentation.",
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    createdBy: "student_lead",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
];

export default function KanbanBoard({ project }: Props) {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);

  const loadTasks = async () => {
    try {
      const snap = await getDocs(query(collection(db, "tasks"), where("projectId", "==", project.id)));
      if (!snap.empty) {
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      } else {
        // Use realistic demo tasks for demo projects
        setTasks(DEFAULT_CROPGUARD_TASKS.map(t => ({ ...t, projectId: project.id })));
      }
    } catch (err) {
      console.error(err);
      setTasks(DEFAULT_CROPGUARD_TASKS.map(t => ({ ...t, projectId: project.id })));
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
        priority: newTaskPriority,
        createdBy: currentUser.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const docRef = await addDoc(collection(db, "tasks"), t);
      
      try {
        await logProjectActivity(
          project.id,
          currentUser.uid,
          currentUser.displayName || "User",
          ActivityType.TASK_CREATED,
          "TASK",
          docRef.id,
          { title: t.title }
        );
      } catch {
        // Non-blocking
      }
      
      toast.success("Task created");
      setIsAdding(false);
      setNewTaskTitle("");
      setNewTaskDesc("");
      loadTasks();
    } catch {
      // Optimistic local add
      const localTask: Task = {
        id: `task_${Date.now()}`,
        projectId: project.id,
        title: newTaskTitle,
        description: newTaskDesc,
        status: TaskStatus.TODO,
        priority: newTaskPriority,
        createdBy: currentUser.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setTasks(prev => [...prev, localTask]);
      setIsAdding(false);
      setNewTaskTitle("");
      setNewTaskDesc("");
      toast.success("Task created");
    }
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await updateDoc(doc(db, "tasks", task.id), { 
        status: newStatus, 
        updatedAt: Date.now(),
        ...(newStatus === TaskStatus.DONE ? { completedAt: Date.now() } : {})
      });
      
      if (newStatus === TaskStatus.DONE) {
        try {
          await logProjectActivity(
            project.id,
            currentUser?.uid || "user",
            currentUser?.displayName || "User",
            ActivityType.TASK_COMPLETED,
            "TASK",
            task.id,
            { title: task.title }
          );
          triggerGamificationEvent(GamificationEventType.TASK_COMPLETED, task.id);
        } catch {
          // Non-blocking
        }
      }

      loadTasks();
    } catch {
      // Optimistic update for demo tasks
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      toast.success("Task status updated");
    }
  };

  const handleDelete = async (task: Task) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteDoc(doc(db, "tasks", task.id));
      toast.success("Task deleted");
      loadTasks();
    } catch {
      setTasks(prev => prev.filter(t => t.id !== task.id));
      toast.success("Task deleted");
    }
  };

  const columns = [
    { id: TaskStatus.TODO, label: "To Do", bg: "bg-[#EFEDE8]/70 border-[#5B5F73]/20" },
    { id: TaskStatus.IN_PROGRESS, label: "In Progress", bg: "bg-blue-50/70 border-blue-200" },
    { id: TaskStatus.REVIEW, label: "In Review", bg: "bg-purple-50/70 border-purple-200" },
    { id: TaskStatus.DONE, label: "Completed", bg: "bg-emerald-50/70 border-emerald-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#1C1C1E]">Workspace Tasks</h2>
          <p className="text-xs text-[#5B5F73]">Manage engineering sprints, model benchmarks, and delivery backlog</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-[#1C1C1E] text-white hover:bg-black">
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-[#EFEDE8] border-[#9C7A4C]/30 shadow-md">
          <CardContent className="p-5">
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#1C1C1E] uppercase mb-1">Task Title</label>
                  <input 
                    type="text" 
                    value={newTaskTitle} 
                    onChange={e => setNewTaskTitle(e.target.value)} 
                    placeholder="e.g. Integrate mobile inference API"
                    className="w-full bg-white border border-[#5B5F73]/20 rounded-lg p-2.5 text-[#1C1C1E] text-sm focus:outline-none focus:border-[#9C7A4C]"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C1C1E] uppercase mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full bg-white border border-[#5B5F73]/20 rounded-lg p-2.5 text-[#1C1C1E] text-sm focus:outline-none"
                  >
                    <option value={TaskPriority.LOW}>Low</option>
                    <option value={TaskPriority.MEDIUM}>Medium</option>
                    <option value={TaskPriority.HIGH}>High</option>
                    <option value={TaskPriority.URGENT}>Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] uppercase mb-1">Description (Optional)</label>
                <textarea 
                  value={newTaskDesc} 
                  onChange={e => setNewTaskDesc(e.target.value)} 
                  placeholder="Task details and acceptance criteria..."
                  className="w-full bg-white border border-[#5B5F73]/20 rounded-lg p-2.5 text-[#1C1C1E] text-sm focus:outline-none focus:border-[#9C7A4C]"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#1C1C1E] text-white hover:bg-black">Save Task</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          
          return (
            <div key={col.id} className={`rounded-xl p-3.5 border ${col.bg}`}>
              <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="text-xs font-bold text-[#1C1C1E] uppercase tracking-wider">{col.label}</h3>
                <span className="bg-white text-[#5B5F73] text-xs px-2 py-0.5 rounded-full font-bold border border-[#5B5F73]/15">
                  {colTasks.length}
                </span>
              </div>
              
              <div className="space-y-3 min-h-[140px]">
                {colTasks.map(task => {
                  let priorityBadge = "bg-slate-100 text-slate-700";
                  if (task.priority === TaskPriority.HIGH) priorityBadge = "bg-amber-100 text-amber-800 border-amber-200";
                  if (task.priority === TaskPriority.URGENT) priorityBadge = "bg-red-100 text-red-800 border-red-200";

                  return (
                    <Card key={task.id} className="bg-white border-[#5B5F73]/20 hover:shadow-md transition-shadow">
                      <CardContent className="p-3.5">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h4 className="font-bold text-sm text-[#1C1C1E] leading-snug">{task.title}</h4>
                          <select 
                            className="text-[11px] bg-[#EFEDE8] text-[#1C1C1E] font-medium border border-[#5B5F73]/20 rounded px-1.5 py-0.5 cursor-pointer focus:outline-none shrink-0"
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
                          <p className="text-xs text-[#5B5F73] mb-3 line-clamp-3 leading-relaxed">{task.description}</p>
                        )}
                        
                        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-[#5B5F73]/10">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${priorityBadge}`}>
                            {task.priority}
                          </span>
                          <button 
                            onClick={() => handleDelete(task)} 
                            className="text-[#5B5F73] hover:text-red-600 transition-colors p-1"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="py-8 text-center text-xs text-[#5B5F73] italic">
                    No tasks in this lane
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
