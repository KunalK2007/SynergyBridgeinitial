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
        const qApps = query(appsRef, where("problemId", "in", problemIds.slice(0, 30)));
        const appSnaps = await getDocs(qApps);

        const loaded: ReviewerApp[] = appSnaps.docs.map(d => {
          const app = { id: d.id, ...d.data() } as Application;
          const pTitle = problems.find(p => p.id === app.problemId)?.title || "Unknown Problem";
          return { app, problemTitle: pTitle };
        });

        loaded.sort((a, b) => {
          const scoreA = a.app.fitScore ?? a.app.synergyBridgeFitScore ?? a.app.prismFitScore ?? a.app.fitResult?.score ?? 0;
          const scoreB = b.app.fitScore ?? b.app.synergyBridgeFitScore ?? b.app.prismFitScore ?? b.app.fitResult?.score ?? 0;
          return scoreB - scoreA;
        });
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

  if (loading) return <div className="text-[#5B5F73]">Loading dashboard...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1C1C1E] mb-2">Application Review</h1>
        <p className="text-[#5B5F73]">Review applications for your problems.</p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-lg p-8 text-center">
          <p className="text-[#5B5F73] mb-4">No applications received yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(({ app, problemTitle }) => {
            const rawScore = app.fitScore ?? app.synergyBridgeFitScore ?? app.prismFitScore ?? app.fitResult?.score;
            const fitScore = typeof rawScore === "number" && !isNaN(rawScore)
              ? (rawScore > 0 && rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore))
              : 0;

            let statusColor = "bg-[#5B5F73]/10 text-[#5B5F73] dark:text-[#9499AD]";
            if (app.status === "ACCEPTED") statusColor = "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
            if (app.status === "REJECTED" || app.status === "WITHDRAWN") statusColor = "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800";
            if (app.status === "SHORTLISTED") statusColor = "bg-[#9C7A4C]/10 dark:bg-[#9C7A4C]/20 text-[#9C7A4C] dark:text-[#C4A880] border border-[#9C7A4C]/20 dark:border-[#9C7A4C]/40";

            return (
              <Card key={app.id}>
                <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${statusColor}`}>
                        {app.status}
                      </span>
                      {app.teamId ? (
                        <span className="flex items-center text-xs text-[#9C7A4C] bg-[#9C7A4C]/10 px-2 py-0.5 rounded border border-[#9C7A4C]/20">
                          <Users className="w-3 h-3 mr-1" /> Team
                        </span>
                      ) : (
                        <span className="flex items-center text-xs text-[#5B5F73] bg-[#5B5F73]/10 px-2 py-0.5 rounded border border-[#5B5F73]/20">
                          <User className="w-3 h-3 mr-1" /> Individual
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-[#1C1C1E] line-clamp-1">{problemTitle}</h3>
                    <p className="text-sm text-[#5B5F73]">
                      Applied: {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-black text-[#1C1C1E]">{fitScore}%</div>
                      <div className="text-[10px] text-[#5B5F73] uppercase tracking-wider font-bold">SynergyBridge Fit</div>
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
