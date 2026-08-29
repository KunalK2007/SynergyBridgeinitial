"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Application, ApplicationStatus } from "@/types/application";
import { Problem } from "@/types/problem";
import { ProjectStatus } from "@/types/project";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { createNotification } from "@/lib/services/notifications";
import { NotificationType } from "@/types/notification";

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const router = useRouter();

  const [application, setApplication] = useState<Application | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    async function load() {
      if (!currentUser || !id) return;
      try {
        const appSnap = await getDoc(doc(db, "applications", id as string));
        if (!appSnap.exists()) {
          toast.error("Application not found");
          router.push("/dashboard/applications");
          return;
        }
        const app = { id: appSnap.id, ...appSnap.data() } as Application;
        
        const pSnap = await getDoc(doc(db, "problems", app.problemId));
        if (!pSnap.exists()) {
          toast.error("Associated problem not found");
          return;
        }
        const p = { id: pSnap.id, ...pSnap.data() } as Problem;
        
        if (p.posterId !== currentUser.uid && currentUser.role !== "ADMIN") {
          toast.error("Unauthorized");
          router.push("/dashboard/applications");
          return;
        }

        setApplication(app);
        setProblem(p);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, currentUser, router]);

  const handleUpdateStatus = async (newStatus: ApplicationStatus) => {
    if (!application || !problem || !currentUser) return;
    
    if (newStatus === ApplicationStatus.REJECTED && !rejectReason) {
      toast.error("Please select or enter a rejection reason.");
      return;
    }

    setUpdating(true);
    try {
      const appRef = doc(db, "applications", application.id);
      
      const updateData: Partial<Application> = {
        status: newStatus,
        reviewedAt: Date.now(),
        reviewedBy: currentUser.uid,
        updatedAt: Date.now()
      };
      if (newStatus === ApplicationStatus.REJECTED) {
        updateData.rejectionReason = rejectReason;
      }
      
      await updateDoc(appRef, updateData);
      
      // If ACCEPTED, create Project
      if (newStatus === ApplicationStatus.ACCEPTED) {
        const projectData = {
          problemId: problem.id,
          applicationId: application.id,
          teamId: application.teamId || null,
          studentIds: [application.applicantId], // In a real team, fetch members
          title: `Project: ${problem.title}`,
          status: ProjectStatus.ALLOCATED,
          progress: 0,
          startDate: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await addDoc(collection(db, "projects"), projectData);
        
        // Notify
        await createNotification(
          application.applicantId,
          NotificationType.APPLICATION_ACCEPTED,
          "Application Accepted!",
          `Your application for ${problem.title} was accepted. A new project workspace has been created.`,
          "/dashboard/student" // Future: /dashboard/projects
        );
      } else if (newStatus === ApplicationStatus.REJECTED) {
        await createNotification(
          application.applicantId,
          NotificationType.APPLICATION_REJECTED,
          "Application Update",
          `Your application for ${problem.title} was declined. Reason: ${rejectReason}`
        );
      }

      setApplication({ ...application, ...updateData });
      toast.success(`Application marked as ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="text-slate-400">Loading application...</div>;
  if (!application || !problem) return null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      <Link href="/dashboard/applications" className="text-sm text-[#5B5F73] dark:text-slate-400 hover:text-[#1C1C1E] dark:hover:text-white flex items-center mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reviews
      </Link>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1C1C1E] dark:text-white">{problem.title}</h1>
          <p className="text-[#5B5F73] dark:text-slate-400 mt-2">Application from {application.teamId ? "Team" : "Individual Applicant"}</p>
        </div>
        <div className="px-3 py-1 bg-[#EFEDE8] dark:bg-slate-800 text-[#1C1C1E] dark:text-slate-300 rounded font-semibold text-sm border border-[#5B5F73]/20 dark:border-slate-700">
          Status: {application.status}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Proposal</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-[#1C1C1E] dark:text-slate-300">{application.proposal}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Motivation</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-[#1C1C1E] dark:text-slate-300">{application.motivation}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {(() => {
            const rawScore = application.fitScore ?? application.synergyBridgeFitScore ?? application.prismFitScore ?? application.fitResult?.score;
            const fitScore = typeof rawScore === "number" && !isNaN(rawScore)
              ? (rawScore > 0 && rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore))
              : 0;
            return (
              <Card className="border-indigo-500/30">
                <CardHeader className="bg-indigo-900/10 border-b border-indigo-500/20">
                  <CardTitle className="text-indigo-600 dark:text-indigo-400 flex justify-between items-center">
                    <span>SynergyBridge Fit</span>
                    <span className="text-2xl font-black text-[#1C1C1E] dark:text-white">{fitScore}%</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="text-sm text-[#5B5F73] dark:text-slate-300 space-y-2">
                    {application.fitResult?.strengths.map((str, i) => (
                      <div key={i} className="flex gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {application.status !== ApplicationStatus.ACCEPTED && application.status !== ApplicationStatus.REJECTED && (
            <Card>
              <CardHeader>
                <CardTitle>Review Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleUpdateStatus(ApplicationStatus.ACCEPTED)}
                  disabled={updating}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Accept & Create Project
                </Button>
                
                <div className="pt-4 border-t border-[#5B5F73]/20 dark:border-slate-800 space-y-2">
                  <select 
                    className="w-full bg-[#EFEDE8] dark:bg-slate-900 border border-[#5B5F73]/30 dark:border-slate-700 rounded p-2 text-sm text-[#1C1C1E] dark:text-white"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  >
                    <option value="">Select Rejection Reason...</option>
                    <option value="Skill mismatch">Skill mismatch</option>
                    <option value="Proposal insufficient">Proposal insufficient</option>
                    <option value="Team composition issue">Team composition issue</option>
                    <option value="Problem requirements changed">Problem requirements changed</option>
                    <option value="Other">Other</option>
                  </select>
                  <Button 
                    variant="outline" 
                    className="w-full border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => handleUpdateStatus(ApplicationStatus.REJECTED)}
                    disabled={updating || !rejectReason}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject Application
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
