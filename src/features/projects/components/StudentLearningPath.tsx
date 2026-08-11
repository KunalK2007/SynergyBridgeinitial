"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { LearningPath } from "@/types/ai-mentor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowRight, BookOpen, AlertCircle, Target, CheckCircle } from "lucide-react";
import { generateLearningPath } from "@/lib/utils/learning-path";
import { Project } from "@/types/project";
import { Problem } from "@/types/problem";
import { Task } from "@/types/task";
import { Milestone } from "@/types/milestone";
import { StudentProfile } from "@/types/profile";

export function StudentLearningPath() {
  const { currentUser } = useAuth();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPaths() {
      if (!currentUser) return;
      try {
        // Fetch active projects
        const projSnap = await getDocs(query(collection(db, "projects"), where("studentIds", "array-contains", currentUser.uid)));
        
        let allPaths: LearningPath[] = [];

        // Fetch student profile
        const studentSnap = await getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid)));
        const profile = studentSnap.empty ? { skills: [] } as Partial<StudentProfile> : studentSnap.docs[0].data() as StudentProfile;

        // We compute paths across all active projects
        for (const p of projSnap.docs) {
          const project = { id: p.id, ...p.data() } as Project;
          if (project.status === "COMPLETED") continue;

          // Fetch related data
          const [probSnap, taskSnap, msSnap] = await Promise.all([
             getDocs(query(collection(db, "problems"), where("__name__", "==", project.problemId))),
             getDocs(query(collection(db, "tasks"), where("projectId", "==", project.id))),
             getDocs(query(collection(db, "milestones"), where("projectId", "==", project.id)))
          ]);
          
          if (probSnap.empty) continue;
          const problem = probSnap.docs[0].data() as Problem;
          const tasks = taskSnap.docs.map(t => t.data() as Task);
          const milestones = msSnap.docs.map(m => m.data() as Milestone);

          const projectPaths = generateLearningPath(
            currentUser.uid,
            project.id,
            profile.skills || [],
            problem.skills || [],
            tasks,
            milestones
          );

          allPaths = [...allPaths, ...projectPaths];
        }

        // Sort globally by priority
        allPaths.sort((a, b) => a.priority - b.priority);
        // Only show top 5 globally
        setPaths(allPaths.slice(0, 5));
      } catch (error) {
        console.error("Failed to load learning paths", error);
      } finally {
        setLoading(false);
      }
    }
    loadPaths();
  }, [currentUser]);

  if (loading) {
    return <div className="animate-pulse h-32 bg-slate-800 rounded-lg"></div>;
  }

  if (paths.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            My Learning Path
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm">You currently have no critical skill gaps for your active projects. Great job!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          My Learning Path
        </CardTitle>
        <Link href="/dashboard/student/mentor" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium hover:bg-slate-800 h-9 px-3 text-indigo-400 hover:text-indigo-300">
          Ask AI Mentor <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {paths.map((path) => (
            <div key={path.id} className="p-4 rounded-lg border border-slate-800 bg-slate-800/50 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    {path.targetSkillId}
                    {path.priority <= 2 && <AlertCircle className="w-4 h-4 text-rose-400" />}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">{path.reason}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <div className="text-xs font-medium px-2 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1">
                      <Target className="w-3 h-3 text-indigo-400" />
                      Target: {path.targetLevel}
                   </div>
                   <div className="text-xs text-slate-500">
                      Current: {path.currentLevel}
                   </div>
                </div>
              </div>
              
              {path.recommendedResources.length > 0 && (
                <div className="bg-slate-950 rounded p-3 text-sm text-slate-300 border border-slate-800/50">
                  <div className="font-medium text-slate-400 mb-1 text-xs uppercase tracking-wider">Recommended Action</div>
                  <ul className="list-disc list-inside space-y-1">
                    {path.recommendedResources.map((res, i) => (
                      <li key={i}>{res}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
