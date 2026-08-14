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
        status: ProblemStatus.DRAFT,
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
        <h1 className="text-3xl font-bold tracking-tight text-[#1C1C1E] mb-2">Problem Moderation</h1>
        <p className="text-[#5B5F73]">Review, verify, or reject published challenges.</p>
      </div>

      <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#1C1C1E]">
            <thead className="bg-[#5B5F73]/10 text-[#5B5F73] uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Title &amp; Org</th>
                <th className="px-6 py-4">Domain</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#5B5F73]/10">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#5B5F73]">Loading problems...</td>
                </tr>
              ) : problems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#5B5F73]">No published problems found.</td>
                </tr>
              ) : problems.map((problem) => (
                <tr key={problem.id} className="hover:bg-[#5B5F73]/5">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#1C1C1E] mb-1">{problem.title}</div>
                    <div className="text-xs text-[#5B5F73]">{problem.organizationName}</div>
                  </td>
                  <td className="px-6 py-4 text-[#5B5F73]">{problem.domain}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      problem.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                      problem.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {problem.verificationStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(`/explore/problems/${problem.id}`, '_blank')}>
                      View
                    </Button>
                    {problem.verificationStatus !== VerificationStatus.VERIFIED && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleVerify(problem.id)}>
                        Verify
                      </Button>
                    )}
                    {problem.verificationStatus !== VerificationStatus.REJECTED && (
                      <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setRejectId(problem.id)}>
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
        <div className="fixed inset-0 bg-[#1E2135]/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#F6F5F2] border border-[#5B5F73]/20 p-6 rounded-xl max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-[#1C1C1E] mb-2">Reject Problem</h3>
            <p className="text-sm text-[#5B5F73] mb-4">Provide a reason for rejection. This will be visible to the poster and the problem will be sent back to Draft status.</p>
            <textarea
              className="w-full bg-white border border-[#5B5F73]/30 rounded-md px-3 py-2 text-sm text-[#1C1C1E] focus:ring-[#9C7A4C] mb-4"
              rows={4}
              placeholder="e.g. Please clarify the success criteria..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => { setRejectId(null); setRejectReason(""); }}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleReject}>Confirm Rejection</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
