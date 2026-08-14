import { useState, useEffect } from "react";
import { Project } from "@/types/project";
import { useAuth } from "@/features/auth/AuthContext";
import { FundingGrant, FundingStatus } from "@/types/funding";
import { OriginalityReport } from "@/types/originality";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { BadgeDollarSign, ShieldCheck, CheckCircle2, Clock, XCircle, Play } from "lucide-react";

interface FundingTabProps {
  project: Project;
}

export default function FundingTab({ project }: FundingTabProps) {
  const { currentUser, getIdToken } = useAuth();
  const [grants, setGrants] = useState<FundingGrant[]>([]);
  const [originalityReport, setOriginalityReport] = useState<OriginalityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = (p: unknown) => console.log(p);

  const isStudent = currentUser?.role === "STUDENT";
  const isReviewer = currentUser?.role === "ADMIN" || currentUser?.role === "FACULTY" || currentUser?.role === "GOVERNMENT" || currentUser?.role === "INDUSTRY";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
    
    // Listen to grants
    const qGrants = query(collection(db, "fundingGrants"), where("projectId", "==", project.id));
    const unsubGrants = onSnapshot(qGrants, (snap) => {
      setGrants(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FundingGrant)));
    });

    // Listen to originality
    const qOrig = query(collection(db, "originalityReports"), where("projectId", "==", project.id));
    const unsubOrig = onSnapshot(qOrig, (snap) => {
      if (!snap.empty) {
        setOriginalityReport(snap.docs[0].data() as OriginalityReport);
      }
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
      alert("Originality assessed successfully.");
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, variant: "default" });
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
      alert("Funding requested.");
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
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
      alert(`Funding ${decision.toLowerCase()}d.`);
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDisburse = async (grantId: string, milestoneId: string) => {
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/funding/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ grantId, milestoneId })
      });
      if (!res.ok) throw new Error("Failed to disburse funding");
      alert("Disbursement simulated successfully.");
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (loading) return <div>Loading funding data...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Originality Section */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <CardTitle className="text-slate-100">Originality Report</CardTitle>
            </div>
            <CardDescription>MVP Originality Engine</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {originalityReport ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`text-4xl font-bold ${originalityReport.passed ? 'text-green-500' : 'text-red-500'}`}>
                    {originalityReport.score}
                    <span className="text-xl text-slate-500">/100</span>
                  </div>
                  <div>
                    {originalityReport.passed ? (
                      <div className="flex items-center gap-1 text-green-500 text-sm font-medium"><CheckCircle2 className="w-4 h-4" /> Passed Minimum Threshold</div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-500 text-sm font-medium"><XCircle className="w-4 h-4" /> Below Threshold</div>
                    )}
                    <div className="text-xs text-slate-500 mt-1">Version {originalityReport.version} • {new Date(originalityReport.assessedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                {originalityReport.flags.length > 0 && (
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <p className="text-xs font-semibold text-slate-400 mb-2">Notice Flags:</p>
                    <ul className="text-xs text-amber-500 list-disc list-inside space-y-1">
                      {originalityReport.flags.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                )}
                {isReviewer && (
                  <Button variant="outline" size="sm" onClick={handleAssessOriginality} className="w-full">
                    Re-Assess Originality
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <p className="mb-4">No originality report generated yet.</p>
                {isReviewer && (
                  <Button onClick={handleAssessOriginality}>Run Assessment (MVP)</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funding Request Action */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BadgeDollarSign className="w-5 h-5 text-emerald-400" />
              <CardTitle className="text-slate-100">Micro-Funding</CardTitle>
            </div>
            <CardDescription>Request grants for project support</CardDescription>
          </CardHeader>
          <CardContent>
            {isStudent && (
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-between" onClick={() => handleRequestFunding("SEED", 25000)}>
                  <span>Request Seed Grant</span>
                  <span className="text-slate-400 font-mono">Max 25k INR</span>
                </Button>
                <Button variant="outline" className="w-full justify-between" onClick={() => handleRequestFunding("GROWTH", 100000)}>
                  <span>Request Growth Grant</span>
                  <span className="text-slate-400 font-mono">Max 100k INR</span>
                </Button>
              </div>
            )}
            {!isStudent && (
              <div className="text-center py-6 text-slate-500 text-sm">
                Students can initiate funding requests from this panel.
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Grants List */}
      <h3 className="text-xl font-semibold text-white mt-8 mb-4">Funding Grants</h3>
      {grants.length === 0 ? (
        <div className="text-slate-500 bg-slate-900 p-8 rounded-lg border border-slate-800 text-center">
          No funding grants requested.
        </div>
      ) : (
        <div className="space-y-4">
          {grants.map(grant => (
            <Card key={grant.id} className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-slate-100">{grant.tier} GRANT</CardTitle>
                    <CardDescription>Requested: {grant.requestedAmount} {grant.currency}</CardDescription>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    grant.status === 'APPROVED' || grant.status === 'DISBURSED' || grant.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                    grant.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>
                    {grant.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Milestones */}
                <div className="space-y-2 mt-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase">Milestones</h4>
                  {grant.milestones.map(m => (
                    <div key={m.id} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        {m.status === 'PENDING' ? <Clock className="w-4 h-4 text-amber-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {m.title}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm text-slate-400">{m.amount} {grant.currency}</span>
                        {isReviewer && m.status === 'PENDING' && grant.status === 'APPROVED' && (
                          <Button size="sm" variant="outline" onClick={() => handleDisburse(grant.id, m.id)}>
                            <Play className="w-3 h-3 mr-1" /> Disburse
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reviewer Actions */}
                {isReviewer && (grant.status === "REQUESTED" || grant.status === "UNDER_REVIEW") && (
                  <div className="flex gap-2 mt-6 pt-4 border-t border-slate-800">
                    <Button className="flex-1" onClick={() => handleReviewFunding(grant.id, "APPROVE")}>Approve Request</Button>
                    <Button className="flex-1" variant="default" onClick={() => handleReviewFunding(grant.id, "REJECT")}>Reject Request</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
