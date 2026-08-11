"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Problem, ProblemStatus, VerificationStatus } from "@/types/problem";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthContext";
import toast from "react-hot-toast";

export default function AdminProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchProblems = async () => {
    setLoading(true);
    try {
      // Fetch problems pending review or unverified (that are published)
      const q = query(
        collection(db, "problems"),
        where("status", "==", ProblemStatus.PUBLISHED)
      );
      const snapshot = await getDocs(q);
      setProblems(snapshot.docs.map(doc => doc.data() as Problem).sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Failed to fetch problems", error);
      toast.error("Failed to fetch problems");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProblems();
  }, []);

  const handleVerify = async (id: string) => {
    try {
      const problemRef = doc(db, "problems", id);
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      await updateDoc(problemRef, {
        verificationStatus: VerificationStatus.VERIFIED,
        moderatedBy: currentUser?.uid,
        moderatedAt: now,
        moderationReason: ""
      });
      toast.success("Problem verified!");
      fetchProblems();
    } catch (error) {
      console.error(error);
      toast.error("Failed to verify problem");
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      const problemRef = doc(db, "problems", rejectId);
      const now = Date.now();
      await updateDoc(problemRef, {
        verificationStatus: VerificationStatus.REJECTED,
        status: ProblemStatus.DRAFT, // send back to draft
        moderatedBy: currentUser?.uid,
        moderatedAt: now,
        moderationReason: rejectReason
      });
      toast.success("Problem rejected and sent back to poster.");
      setRejectId(null);
      setRejectReason("");
      fetchProblems();
    } catch (error) {
      console.error(error);
      toast.error("Failed to reject problem");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Problem Moderation</h1>
        <p className="text-slate-400">Review, verify, or reject published challenges.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Title & Org</th>
                <th className="px-6 py-4">Domain</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading problems...</td>
                </tr>
              ) : problems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No published problems found.</td>
                </tr>
              ) : problems.map((problem) => (
                <tr key={problem.id} className="hover:bg-slate-800/20">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-200 mb-1">{problem.title}</div>
                    <div className="text-xs text-slate-500">{problem.organizationName}</div>
                  </td>
                  <td className="px-6 py-4">{problem.domain}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      problem.verificationStatus === 'VERIFIED' ? 'bg-green-500/20 text-green-400' :
                      problem.verificationStatus === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {problem.verificationStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(`/explore/problems/${problem.id}`, '_blank')}>
                      View
                    </Button>
                    {problem.verificationStatus !== VerificationStatus.VERIFIED && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-500" onClick={() => handleVerify(problem.id)}>
                        Verify
                      </Button>
                    )}
                    {problem.verificationStatus !== VerificationStatus.REJECTED && (
                      <Button variant="outline" size="sm" className="text-red-400 border-red-900/50 hover:bg-red-950" onClick={() => setRejectId(problem.id)}>
                        Reject
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rejectId && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-2">Reject Problem</h3>
            <p className="text-sm text-slate-400 mb-4">Provide a reason for rejection. This will be visible to the poster and the problem will be sent back to Draft status.</p>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:ring-blue-500 mb-4"
              rows={4}
              placeholder="e.g. Please clarify the success criteria..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => { setRejectId(null); setRejectReason(""); }}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-500" onClick={handleReject}>Confirm Rejection</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
