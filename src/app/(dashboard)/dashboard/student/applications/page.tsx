"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Application, ApplicationStatus } from "@/types/application";
import { Problem } from "@/types/problem";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FileText, ArrowRight, XCircle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface EnrichedApp {
  app: Application;
  problem: Problem | null;
}

export default function StudentApplicationsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<EnrichedApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      try {
        const appsRef = collection(db, "applications");
        const qApps = query(appsRef, where("applicantId", "==", currentUser.uid));
        const appSnaps = await getDocs(qApps);

        const loadedApps: EnrichedApp[] = [];
        for (const d of appSnaps.docs) {
          const app = { id: d.id, ...d.data() } as Application;
          let problem = null;
          try {
            const pSnap = await getDoc(doc(db, "problems", app.problemId));
            if (pSnap.exists()) problem = { id: pSnap.id, ...pSnap.data() } as Problem;
          } catch (e) {
            console.error(e);
          }
          loadedApps.push({ app, problem });
        }

        loadedApps.sort((a, b) => b.app.createdAt - a.app.createdAt);
        setApplications(loadedApps);
      } catch (err) {
        console.error("Error loading apps", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  const handleWithdraw = async (appId: string) => {
    if (!confirm("Are you sure you want to withdraw this application?")) return;
    try {
      await updateDoc(doc(db, "applications", appId), {
        status: ApplicationStatus.WITHDRAWN,
        updatedAt: new Date().getTime()
      });
      toast.success("Application withdrawn");
      setApplications(prev => prev.map(a => a.app.id === appId ? { ...a, app: { ...a.app, status: ApplicationStatus.WITHDRAWN } } : a));
    } catch (err) {
      console.error(err);
      toast.error("Failed to withdraw");
    }
  };

  if (loading) return <div className="text-[#5B5F73]">Loading applications...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1C1C1E] mb-2">My Applications</h1>
        <p className="text-[#5B5F73]">Track your submitted problem solutions.</p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-lg p-8 text-center">
          <FileText className="w-8 h-8 text-[#5B5F73]/40 mx-auto mb-3" />
          <p className="text-[#5B5F73] mb-4">You have not applied to any problems yet.</p>
          <Button onClick={() => router.push("/explore/problems")}>
            Explore Problems
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(({ app, problem }) => {
            const canWithdraw = app.status === ApplicationStatus.SUBMITTED || app.status === ApplicationStatus.UNDER_REVIEW || app.status === ApplicationStatus.SHORTLISTED;

            let statusColor = "text-[#5B5F73]";
            if (app.status === ApplicationStatus.ACCEPTED) statusColor = "text-emerald-600";
            if (app.status === ApplicationStatus.REJECTED || app.status === ApplicationStatus.WITHDRAWN) statusColor = "text-red-600";
            if (app.status === ApplicationStatus.SHORTLISTED) statusColor = "text-[#9C7A4C]";

            return (
              <Card key={app.id}>
                <CardContent className="p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-bold text-[#1C1C1E]">
                      {problem?.title || "Unknown Problem"}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-[#5B5F73]">
                      <span>Submitted: {new Date(app.createdAt).toLocaleDateString()}</span>
                      <span>Type: {app.teamId ? "Team" : "Individual"}</span>
                      {(() => {
                        const rawScore = app.fitScore ?? app.synergyBridgeFitScore ?? app.prismFitScore ?? app.fitResult?.score;
                        const fitScore = typeof rawScore === "number" && !isNaN(rawScore)
                          ? (rawScore > 0 && rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore))
                          : 0;
                        return <span>Fit Score: {fitScore}%</span>;
                      })()}
                    </div>
                    <p className={`text-sm font-semibold mt-2 ${statusColor}`}>
                      Status: {app.status.replace("_", " ")}
                    </p>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto">
                    {canWithdraw && (
                      <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 flex-1 md:flex-none" onClick={() => handleWithdraw(app.id)}>
                        <XCircle className="w-4 h-4 mr-2" /> Withdraw
                      </Button>
                    )}
                    <Button onClick={() => router.push(`/explore/problems/${app.problemId}`)} variant="outline" className="flex-1 md:flex-none">
                      View Problem <ArrowRight className="w-4 h-4 ml-2" />
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
