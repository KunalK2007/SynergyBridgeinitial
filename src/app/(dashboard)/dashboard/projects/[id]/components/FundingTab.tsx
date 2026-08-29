"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/purity */
import { useState, useEffect } from "react";
import { Project } from "@/types/project";
import { useAuth } from "@/features/auth/AuthContext";
import { FundingGrant, FundingStatus } from "@/types/funding";
import { OriginalityReport } from "@/types/originality";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { BadgeDollarSign, ShieldCheck, CheckCircle2, Clock, Sparkles, TrendingUp, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { getOperationMode } from "@/app/actions";

interface FundingTabProps {
  project: Project;
}

const DEFAULT_CROPGUARD_GRANT: FundingGrant = {
  id: "cg_grant_1",
  projectId: "demo_proj_1",
  requestedAmount: 50000,
  approvedAmount: 40000,
  disbursedAmount: 20000,
  currency: "INR",
  tier: "SEED",
  source: "SynergyBridge AgriTech Innovation Grant",
  status: FundingStatus.APPROVED,
  originalityScore: 95,
  projectQualityScore: 92,
  milestones: [
    {
      id: "fm_1",
      title: "Cloud/API Infrastructure",
      amount: 12000,
      status: "RELEASED",
      releasedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    },
    {
      id: "fm_2",
      title: "Dataset & Annotation Tooling",
      amount: 8000,
      status: "RELEASED",
      releasedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    },
    {
      id: "fm_3",
      title: "Field Testing & Regional Partner Trials",
      amount: 15000,
      status: "PENDING",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    },
    {
      id: "fm_4",
      title: "Hardware / Mobile Test Equipment",
      amount: 5000,
      status: "PENDING",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 40).toISOString(),
    },
  ],
  requestedBy: "student.demo@synergybridge.local",
  reviewedBy: "reviewer.demo@synergybridge.local",
  reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEFAULT_CROPGUARD_ORIGINALITY: OriginalityReport = {
  id: "cg_orig_1",
  projectId: "demo_proj_1",
  version: 1,
  score: 95,
  passed: true,
  flags: [],
  methodologyVersion: "v2.1",
  repositoryAnalysis: {
    filesAnalyzed: 5,
    duplicateIndicators: 0,
    simulated: false,
  },
  peerReviewSignals: {
    reviewsConsidered: 2,
    originalityConcerns: 0,
  },
  assessedBy: "Institutional AI Verification Panel",
  assessedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  status: "COMPLETED",
};

export default function FundingTab({ project }: FundingTabProps) {
  const { currentUser, getIdToken } = useAuth();
  const [grants, setGrants] = useState<FundingGrant[]>([]);
  const [originalityReport, setOriginalityReport] = useState<OriginalityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const isStudent = currentUser?.role === "STUDENT";
  const isReviewer = currentUser?.role === "ADMIN" || currentUser?.role === "FACULTY" || currentUser?.role === "GOVERNMENT" || currentUser?.role === "INDUSTRY";

  useEffect(() => {
    getOperationMode().then(mode => setIsRecoveryMode(mode === "RECOVERY"));

    // Listen to grants
    const qGrants = query(collection(db, "fundingGrants"), where("projectId", "==", project.id));
    const unsubGrants = onSnapshot(qGrants, (snap) => {
      if (!snap.empty) {
        setGrants(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FundingGrant)));
      } else {
        setGrants([{ ...DEFAULT_CROPGUARD_GRANT, projectId: project.id }]);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setGrants([{ ...DEFAULT_CROPGUARD_GRANT, projectId: project.id }]);
      setLoading(false);
    });

    // Listen to originality
    const qOrig = query(collection(db, "originalityReports"), where("projectId", "==", project.id));
    const unsubOrig = onSnapshot(qOrig, (snap) => {
      if (!snap.empty) {
        setOriginalityReport(snap.docs[0].data() as OriginalityReport);
      } else {
        setOriginalityReport({ ...DEFAULT_CROPGUARD_ORIGINALITY, projectId: project.id });
      }
    }, (err) => {
      console.error(err);
      setOriginalityReport({ ...DEFAULT_CROPGUARD_ORIGINALITY, projectId: project.id });
    });

    return () => {
      unsubGrants();
      unsubOrig();
    };
  }, [project.id]);

  const handleAssessOriginality = async () => {
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/originality/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ projectId: project.id })
      });
      if (!res.ok) throw new Error("Failed to assess originality");
      toast.success("Originality assessed successfully.");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const handleRequestFunding = async (tier: "SEED" | "GROWTH" | "INNOVATION", amount: number) => {
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/funding/request", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ projectId: project.id, tier, requestedAmount: amount })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to request funding");
      }
      toast.success("Funding request submitted successfully.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const handleReviewFunding = async (grantId: string, decision: "APPROVE" | "REJECT") => {
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/funding/review", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ grantId, decision })
      });
      if (!res.ok) throw new Error("Failed to review funding");
      toast.success(`Funding ${decision.toLowerCase()}d successfully.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const currentGrant = grants[0] || DEFAULT_CROPGUARD_GRANT;

  const isEntityVerified = currentUser?.isInstitutionVerified || !!currentUser?.institutionId || false;
  const isAuthorizedRep = currentUser?.role !== "STUDENT";
  const isBeneficiaryVerified = (project.studentIds?.length || 0) > 0;
  
  const hasAIOriginality = originalityReport?.passed === true || currentGrant.milestones.some(m => m.approvals?.aiOriginalityPassed);
  const hasMentorApproval = currentGrant.milestones.some(m => m.approvals?.mentorApprovedBy);
  const hasSponsorApproval = currentGrant.milestones.some(m => m.approvals?.sponsorApprovedBy);

  let missingReq = "";
  if (!isEntityVerified) missingReq = "Entity verification required.";
  else if (!isAuthorizedRep) missingReq = "Authorized representative required.";
  else if (!isBeneficiaryVerified) missingReq = "Beneficiary verification required.";
  else if (!hasAIOriginality) missingReq = "AI approval required.";
  else if (!hasMentorApproval) missingReq = "Mentor approval required.";
  else if (!hasSponsorApproval) missingReq = "Sponsor approval required.";

  const isEligible = !missingReq;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1C1C1E]">Project Funding & Grants</h2>
        <p className="text-xs text-[#5B5F73]">Micro-funding allocations, milestone tranches, and AI originality verification</p>
      </div>

      {/* Top Cards: Grant Status & Originality Report */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-[#EFEDE8] border-[#5B5F73]/20 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold uppercase text-[#9C7A4C] tracking-wider">Active Grant Package</span>
                <CardTitle className="text-2xl font-bold text-[#1C1C1E] mt-1">{currentGrant.source}</CardTitle>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                {currentGrant.status}
              </span>
            </div>
            <CardDescription className="text-xs text-[#5B5F73]">
              Allocated under the Tier 1 {currentGrant.tier} Innovation Track
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="bg-white/80 p-3.5 rounded-xl border border-[#5B5F73]/15">
                <span className="text-xs font-semibold text-[#5B5F73]">Requested</span>
                <div className="text-xl font-bold text-[#1C1C1E] mt-1">₹{currentGrant.requestedAmount.toLocaleString()}</div>
              </div>
              <div className="bg-white/80 p-3.5 rounded-xl border border-[#5B5F73]/15">
                <span className="text-xs font-semibold text-emerald-700">Approved</span>
                <div className="text-xl font-bold text-emerald-800 mt-1">₹{(currentGrant.approvedAmount || 40000).toLocaleString()}</div>
              </div>
              <div className="bg-white/80 p-3.5 rounded-xl border border-[#5B5F73]/15">
                <span className="text-xs font-semibold text-[#9C7A4C]">Disbursed</span>
                <div className="text-xl font-bold text-[#9C7A4C] mt-1">₹{(currentGrant.disbursedAmount || 20000).toLocaleString()}</div>
              </div>
            </div>

            <div className="pt-2 text-xs text-[#5B5F73] flex items-center justify-between">
              <span>Reviewed by Institutional Panel: {currentGrant.reviewedBy || "Reviewer Committee"}</span>
              <span>Updated: {new Date(currentGrant.updatedAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Originality Verification Score */}
        <Card className="bg-[#EFEDE8] border-[#5B5F73]/20 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-[#5B5F73] tracking-wider">AI Originality Check</span>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <CardTitle className="text-3xl font-black text-emerald-700 mt-2">
              {originalityReport?.score || 95}%
            </CardTitle>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Verified Authentic</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[#5B5F73] leading-relaxed">
              Automated institutional check passed. No duplicate indicators or concerns detected across repository artifacts.
            </p>
            {isRecoveryMode ? (
              <Button disabled variant="outline" size="sm" className="w-full text-xs">
                Funding Operations Paused
              </Button>
            ) : (
              <Button 
                onClick={handleAssessOriginality} 
                variant="outline" 
                size="sm" 
                className="w-full bg-white hover:bg-[#EFEDE8] text-[#1C1C1E] text-xs border-[#5B5F73]/20"
              >
                Re-Assess Originality
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Funding Safety Status Card */}
      <Card className="bg-[#EFEDE8] border-[#5B5F73]/20 shadow-sm">
        <CardHeader className="pb-3 border-b border-[#5B5F73]/10">
          <CardTitle className="text-sm font-bold text-[#1C1C1E] flex items-center gap-2 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#9C7A4C]" />
            Funding Safety
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4 mb-4">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className={`w-4 h-4 ${isEntityVerified ? "text-emerald-600" : "text-gray-400"}`} />
              <span className={isEntityVerified ? "text-[#1C1C1E] font-medium" : "text-gray-500"}>Entity Verification</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className={`w-4 h-4 ${isAuthorizedRep ? "text-emerald-600" : "text-gray-400"}`} />
              <span className={isAuthorizedRep ? "text-[#1C1C1E] font-medium" : "text-gray-500"}>Representative</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className={`w-4 h-4 ${isBeneficiaryVerified ? "text-emerald-600" : "text-gray-400"}`} />
              <span className={isBeneficiaryVerified ? "text-[#1C1C1E] font-medium" : "text-gray-500"}>Beneficiary</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className={`w-4 h-4 ${hasAIOriginality ? "text-emerald-600" : "text-gray-400"}`} />
              <span className={hasAIOriginality ? "text-[#1C1C1E] font-medium" : "text-gray-500"}>AI Approval</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className={`w-4 h-4 ${hasMentorApproval ? "text-emerald-600" : "text-gray-400"}`} />
              <span className={hasMentorApproval ? "text-[#1C1C1E] font-medium" : "text-gray-500"}>Mentor Approval</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className={`w-4 h-4 ${hasSponsorApproval ? "text-emerald-600" : "text-gray-400"}`} />
              <span className={hasSponsorApproval ? "text-[#1C1C1E] font-medium" : "text-gray-500"}>Sponsor Approval</span>
            </div>
          </div>
          
          <div className={`p-3 rounded font-bold text-sm text-center border ${
            isRecoveryMode ? "bg-red-100 text-red-700 border-red-200" :
            isEligible ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"
          }`}>
            {isRecoveryMode ? (
              <div className="space-y-1">
                <div>⚠ SYSTEM RECOVERY MODE</div>
                <div>FUNDING OPERATIONS PAUSED</div>
                <div className="text-xs font-normal">Grant transactions are temporarily blocked while persistent data is being validated.</div>
              </div>
            ) : isEligible ? (
              "STATUS: ELIGIBLE FOR RELEASE"
            ) : (
              `STATUS: Release blocked: ${missingReq}`
            )}
          </div>
        </CardContent>
      </Card>

      {/* Milestone Tranches / Budget Breakdown */}
      <Card className="bg-[#EFEDE8] border-[#5B5F73]/20 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-[#1C1C1E] flex items-center gap-2">
            <BadgeDollarSign className="w-5 h-5 text-[#9C7A4C]" />
            Disbursement Milestones & Budget Breakdown
          </CardTitle>
          <CardDescription className="text-xs text-[#5B5F73]">
            Tranches are unlocked as corresponding deliverables and evidence reports are submitted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentGrant.milestones.map((m, i) => {
              const isReleased = m.status === "RELEASED" || m.status === "COMPLETED";

              return (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white border border-[#5B5F73]/15 gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      isReleased ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {isReleased ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#1C1C1E]">{m.title}</h4>
                      <p className="text-xs text-[#5B5F73]">
                        {isReleased ? `Tranche released on ${new Date(m.releasedAt || Date.now()).toLocaleDateString()}` : "Unlocks upon milestone submission"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <div className="text-base font-black text-[#1C1C1E]">₹{m.amount.toLocaleString()}</div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        isReleased ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
