"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Application } from "@/types/application";
import { Problem } from "@/types/problem";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Users, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
interface ReviewerApp {
  app: Application;
  problemTitle: string;
}

export default function ApplicationReviewDashboard() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<ReviewerApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApps() {
      if (!currentUser || currentUser.role === "STUDENT") {
        setLoading(false);
        return;
      }
      try {
        const pRef = collection(db, "problems");
        let problems: Problem[] = [];
        
        if (currentUser.role === "ADMIN") {
          const pSnaps = await getDocs(pRef);
          problems = pSnaps.docs.map(d => ({ id: d.id, ...d.data() } as Problem));
        } else {
          const qP = query(pRef, where("posterId", "==", currentUser.uid));
          const pSnaps = await getDocs(qP);
          problems = pSnaps.docs.map(d => ({ id: d.id, ...d.data() } as Problem));
        }

        if (problems.length === 0) {
          setLoading(false);
          return;
        }

        const problemIds = problems.map(p => p.id);
        const appsRef = collection(db, "applications");
        
        // Firestore 'in' query supports up to 30 elements. For MVP, we chunk or just query all and filter if > 30.
        // Assuming user has < 30 problems for this demo.
        const qApps = query(appsRef, where("problemId", "in", problemIds.slice(0, 30)));
        const appSnaps = await getDocs(qApps);
        
        const loaded: ReviewerApp[] = appSnaps.docs.map(d => {
          const app = { id: d.id, ...d.data() } as Application;
          const pTitle = problems.find(p => p.id === app.problemId)?.title || "Unknown Problem";
          return { app, problemTitle: pTitle };
        });

        // Sort descending by Fit Score
        loaded.sort((a, b) => (b.app.fitScore || 0) - (a.app.fitScore || 0));
        setApplications(loaded);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load applications");
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, [currentUser]);

  if (loading) return <div className="text-slate-400">Loading dashboard...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Application Review</h1>
        <p className="text-slate-400">Review applications for your problems.</p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
          <p className="text-slate-400 mb-4">No applications received yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(({ app, problemTitle }) => {
            let statusColor = "bg-slate-800 text-slate-300";
            if (app.status === "ACCEPTED") statusColor = "bg-emerald-900/30 text-emerald-400 border border-emerald-800";
            if (app.status === "REJECTED" || app.status === "WITHDRAWN") statusColor = "bg-red-900/30 text-red-400 border border-red-800";
            if (app.status === "SHORTLISTED") statusColor = "bg-blue-900/30 text-blue-400 border border-blue-800";

            return (
              <Card key={app.id}>
                <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${statusColor}`}>
                        {app.status}
                      </span>
                      {app.teamId ? (
                        <span className="flex items-center text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          <Users className="w-3 h-3 mr-1" /> Team
                        </span>
                      ) : (
                        <span className="flex items-center text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          <User className="w-3 h-3 mr-1" /> Individual
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white line-clamp-1">{problemTitle}</h3>
                    <p className="text-sm text-slate-400">
                      Applied: {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">{app.fitScore}%</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">SynergyBridge Fit</div>
                    </div>
                    <Button onClick={() => router.push(`/dashboard/applications/${app.id}`)}>
                      Review <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
