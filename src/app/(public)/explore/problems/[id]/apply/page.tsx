"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Problem, ProblemStatus, TeamPreference } from "@/types/problem";
import { ApplicationStatus } from "@/types/application";
import { Team } from "@/types/team";
import { ProblemFitPanel } from "@/features/matching/components/ProblemFitPanel";
import { normalizeStudentProfile } from "@/lib/utils/profile-helpers";
import { calculateProblemFit, ProblemFitResult } from "@/lib/utils/matching-engine";
import { triggerGamificationEvent } from "@/lib/utils/gamification-client";
import { GamificationEventType } from "@/types/gamification";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ApplyPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [fitResult, setFitResult] = useState<ProblemFitResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligibleTeams, setEligibleTeams] = useState<Team[]>([]);

  const [proposal, setProposal] = useState("");
  const [motivation, setMotivation] = useState("");
  const [applyType, setApplyType] = useState<"INDIVIDUAL" | "TEAM">("INDIVIDUAL");
  const [selectedTeamId, setSelectedTeamId] = useState("");

  useEffect(() => {
    async function init() {
      if (!currentUser || currentUser.role !== "STUDENT" || !id) {
        setLoading(false);
        return;
      }

      try {
        const pSnap = await getDoc(doc(db, "problems", id as string));
        if (!pSnap.exists()) throw new Error("Problem not found");
        const pData = pSnap.data() as Problem;

        if (pData.status !== ProblemStatus.PUBLISHED) {
          toast.error("This problem is not currently accepting applications.");
          router.push(`/explore/problems/${id}`);
          return;
        }

        setProblem(pData);

        if (pData.teamPreference !== TeamPreference.INDIVIDUAL) {
          setApplyType("TEAM");
        }

        const profSnap = await getDoc(doc(db, "studentProfiles", currentUser.uid));
        if (!profSnap.exists()) {
          toast.error("Please complete your profile first.");
          router.push("/dashboard/student/onboarding");
          return;
        }
        const profile = normalizeStudentProfile(profSnap.data());

        const fit = calculateProblemFit(profile, pData);
        setFitResult(fit);

        const appQ = query(
          collection(db, "applications"),
          where("problemId", "==", id),
          where("applicantId", "==", currentUser.uid),
          where("status", "in", [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, ApplicationStatus.SHORTLISTED, ApplicationStatus.ACCEPTED])
        );
        const apps = await getDocs(appQ);
        if (!apps.empty) {
          toast.error("You have already applied to this problem.");
          router.push(`/explore/problems/${id}`);
          return;
        }

        const tQ = query(collection(db, "teams"), where("leaderId", "==", currentUser.uid));
        const tSnaps = await getDocs(tQ);
        const teams = tSnaps.docs.map(d => ({ id: d.id, ...d.data() } as Team));
        setEligibleTeams(teams);
        if (teams.length > 0) setSelectedTeamId(teams[0].id);

      } catch (err) {
        console.error(err);
        toast.error("Failed to load application page.");
        router.push(`/explore/problems/${id}`);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id, currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !problem) return;

    if (proposal.length < 100 || proposal.length > 3000) {
      toast.error("Proposal must be between 100 and 3000 characters.");
      return;
    }
    if (motivation.length < 50 || motivation.length > 1500) {
      toast.error("Motivation must be between 50 and 1500 characters.");
      return;
    }
    if (applyType === "TEAM" && !selectedTeamId) {
      toast.error("Please select a team.");
      return;
    }
    if (problem.teamPreference === TeamPreference.INDIVIDUAL && applyType === "TEAM") {
      toast.error("This problem only accepts individual applications.");
      return;
    }

    setSubmitting(true);
    try {
      const appData = {
        problemId: problem.id,
        applicantId: currentUser.uid,
        teamId: applyType === "TEAM" ? selectedTeamId : null,
        proposal,
        motivation,
        fitScore: fitResult?.score || 0,
        synergyBridgeFitScore: fitResult?.score || 0,
        fitResult,
        status: ApplicationStatus.SUBMITTED,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, "applications"), appData);
      triggerGamificationEvent(GamificationEventType.APPLICATION_SUBMITTED, docRef.id);
      toast.success("Application submitted successfully!");
      router.push("/dashboard/student/applications");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-[#5B5F73] p-8">Loading application...</div>;
  if (!problem || !fitResult) return null;

  return (
    <div className="min-h-screen bg-[#F6F5F2] pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">

        <div>
          <Link href={`/explore/problems/${id}`} className="flex items-center text-sm font-medium text-[#5B5F73] hover:text-[#1C1C1E] transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Problem
          </Link>
          <h1 className="text-3xl font-bold text-[#1C1C1E] mb-2">Apply: {problem.title}</h1>
          <p className="text-[#5B5F73] text-sm">
            This score is generated using the SynergyBridge deterministic matching engine. It is not an AI-generated prediction.
          </p>
        </div>

        <ProblemFitPanel problem={problem} />

        <Card>
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-4">
                <label className="text-sm font-medium text-[#1C1C1E]">Application Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-[#1C1C1E]">
                    <input
                      type="radio"
                      name="applyType"
                      value="INDIVIDUAL"
                      checked={applyType === "INDIVIDUAL"}
                      onChange={() => setApplyType("INDIVIDUAL")}
                      className="text-[#9C7A4C] border-[#5B5F73]"
                    />
                    Apply Individually
                  </label>
                  <label className="flex items-center gap-2 text-[#1C1C1E]">
                    <input
                      type="radio"
                      name="applyType"
                      value="TEAM"
                      checked={applyType === "TEAM"}
                      onChange={() => setApplyType("TEAM")}
                      className="text-[#9C7A4C] border-[#5B5F73]"
                    />
                    Apply with my Team
                  </label>
                </div>
              </div>

              {applyType === "TEAM" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1C1E]">Select Team</label>
                  {eligibleTeams.length > 0 ? (
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="w-full bg-[#F6F5F2] border border-[#5B5F73]/30 rounded-md p-2 text-[#1C1C1E]"
                    >
                      {eligibleTeams.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.memberIds.length} members)</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-amber-700 text-sm p-3 bg-amber-50 border border-amber-200 rounded">
                      You do not lead any teams. <Link href="/dashboard/student/teams/create" className="underline font-bold">Create a team</Link> first.
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1C1C1E]">Proposal</label>
                <textarea
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  placeholder="Describe your proposed solution... (min 100 chars)"
                  className="w-full bg-[#F6F5F2] border border-[#5B5F73]/30 rounded-md p-3 text-[#1C1C1E] h-48 focus:outline-none focus:ring-2 focus:ring-[#9C7A4C]/50"
                  required
                  minLength={100}
                  maxLength={3000}
                />
                <p className="text-xs text-[#5B5F73] flex justify-end">{proposal.length} / 3000</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1C1C1E]">Why are you a good fit?</label>
                <textarea
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Explain why you or your team are uniquely suited... (min 50 chars)"
                  className="w-full bg-[#F6F5F2] border border-[#5B5F73]/30 rounded-md p-3 text-[#1C1C1E] h-24 focus:outline-none focus:ring-2 focus:ring-[#9C7A4C]/50"
                  required
                  minLength={50}
                  maxLength={1500}
                />
                <p className="text-xs text-[#5B5F73] flex justify-end">{motivation.length} / 1500</p>
              </div>

              <Button type="submit" disabled={submitting || (applyType === "TEAM" && !selectedTeamId)} className="w-full">
                {submitting ? "Submitting..." : "Submit Application"}
              </Button>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
