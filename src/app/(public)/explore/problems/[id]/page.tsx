"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Problem, ProblemStatus } from "@/types/problem";
import { SDGs } from "@/lib/constants/taxonomy";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { BadgeCheck, ArrowLeft, Bookmark, Clock, Users, MapPin, ChevronRight, Coins } from "lucide-react";
import toast from "react-hot-toast";
import { ProblemFitPanel } from "@/features/matching/components/ProblemFitPanel";

export default function ProblemDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const docRef = doc(db, "problems", id as string);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data() as Problem;
          if (
            data.status === ProblemStatus.PUBLISHED ||
            currentUser?.uid === data.posterId ||
            currentUser?.role === "ADMIN"
          ) {
            setProblem(data);
          } else {
            toast.error("Problem not found or not accessible");
            router.push("/explore/problems");
          }
        } else {
          toast.error("Problem not found");
          router.push("/explore/problems");
        }
      } catch (error) {
        console.error("Error fetching problem:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProblem();
  }, [id, currentUser, router]);

  useEffect(() => {
    const checkBookmark = async () => {
      if (!currentUser || !id) return;
      try {
        const bookmarkRef = doc(db, `users/${currentUser.uid}/bookmarks`, id as string);
        const snap = await getDoc(bookmarkRef);
        setIsBookmarked(snap.exists());
      } catch (e) {
        console.error("Bookmark check failed", e);
      }
    };
    checkBookmark();
  }, [id, currentUser]);

  const toggleBookmark = async () => {
    if (!currentUser) {
      toast.error("Please sign in to save problems.");
      return;
    }

    setBookmarkLoading(true);
    try {
      const bookmarkRef = doc(db, `users/${currentUser.uid}/bookmarks`, id as string);
      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
        setIsBookmarked(false);
        toast.success("Problem removed from saved.");
      } else {
        await setDoc(bookmarkRef, { savedAt: Date.now() });
        setIsBookmarked(true);
        toast.success("Problem saved.");
      }
    } catch {
      toast.error("Failed to update bookmark.");
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleExpressInterest = () => {
    if (!currentUser) {
      toast.error("Please sign in to continue.");
      return;
    }
    toast("Applications will be enabled in the next phase.", { icon: "ℹ️" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F5F2] flex items-center justify-center">
        <p className="text-[#5B5F73]">Loading challenge...</p>
      </div>
    );
  }

  if (!problem) return null;

  const isVerified = problem.verificationStatus === "VERIFIED";

  return (
    <div className="min-h-screen bg-[#F6F5F2] pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Navigation & Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm font-medium text-[#5B5F73] hover:text-[#1C1C1E] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Repository
          </button>

          <div className="flex gap-2 items-center flex-wrap mb-4">
            <span className="px-2 py-1 bg-[#9C7A4C]/10 text-[#9C7A4C] text-xs font-semibold rounded uppercase tracking-wider">
              {problem.problemType.replace('_', ' ')}
            </span>
            <span className="text-sm text-[#5B5F73] font-medium flex items-center">
              {problem.domain}
              {problem.subDomain && <><ChevronRight className="w-3 h-3 mx-1" /> {problem.subDomain}</>}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-[#1C1C1E] mb-6 leading-tight">
            {problem.title}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 border-y border-[#5B5F73]/20">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#EFEDE8] flex items-center justify-center text-xl font-bold text-[#1C1C1E] border border-[#5B5F73]/20">
                {problem.organizationName?.[0] || 'O'}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1C1C1E] flex items-center gap-2">
                  {problem.organizationName || 'Unknown Organization'}
                  {isVerified && (
                    <span className="flex items-center text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" title="Verified Challenge">
                      <BadgeCheck className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  )}
                </p>
                <p className="text-xs text-[#5B5F73] capitalize">Posted by {problem.posterRole.toLowerCase()}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={toggleBookmark}
                disabled={bookmarkLoading}
                className={isBookmarked ? "text-[#9C7A4C] border-[#9C7A4C]/50 hover:bg-[#9C7A4C]/10" : ""}
              >
                <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? "fill-current" : ""}`} />
                {isBookmarked ? "Saved" : "Save"}
              </Button>
              <Button onClick={handleExpressInterest}>
                Express Interest
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Main Content */}
          <div className="md:col-span-2 space-y-12">

            <section>
              <h2 className="text-xl font-bold text-[#1C1C1E] mb-4">The Challenge</h2>
              <div className="prose max-w-none text-[#5B5F73] whitespace-pre-wrap leading-relaxed">
                {problem.problemStatement}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1C1C1E] mb-4">Why It Matters</h2>
              <div className="prose max-w-none text-[#5B5F73] whitespace-pre-wrap leading-relaxed">
                {problem.whyItMatters}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1C1C1E] mb-4">Expected Outcome</h2>
              <div className="prose max-w-none text-[#5B5F73] whitespace-pre-wrap leading-relaxed">
                {problem.expectedOutcome}
              </div>
            </section>

            {problem.successCriteria && problem.successCriteria.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-[#1C1C1E] mb-4">Success Criteria</h2>
                <ul className="space-y-3">
                  {problem.successCriteria.map((criterion, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-[#5B5F73]">
                      <BadgeCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {problem.constraints && problem.constraints.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-[#1C1C1E] mb-4">Constraints &amp; Limitations</h2>
                <div className="grid gap-4">
                  {problem.constraints.map((constraint, idx) => (
                    <div key={idx} className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-[#1C1C1E] capitalize">{constraint.type.replace('_', ' ')}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                          constraint.severity === 'HIGH' ? 'bg-red-500/20 text-red-600' :
                          constraint.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-700' :
                          'bg-[#9C7A4C]/10 text-[#9C7A4C]'
                        }`}>
                          {constraint.severity}
                        </span>
                      </div>
                      <p className="text-sm text-[#5B5F73]">{constraint.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-8">

            {currentUser?.role === "STUDENT" && <ProblemFitPanel problem={problem} />}

            <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-xl p-6 space-y-6">
              <h3 className="font-bold text-[#1C1C1E] mb-4">Project Overview</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-[#5B5F73] uppercase tracking-wider mb-1">Difficulty</h4>
                  <p className="text-sm text-[#1C1C1E] font-medium capitalize">{problem.difficulty.toLowerCase()}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#5B5F73] uppercase tracking-wider mb-1">Team Preference</h4>
                  <div className="flex items-center text-sm text-[#1C1C1E] font-medium capitalize">
                    <Users className="w-4 h-4 mr-2 text-[#5B5F73]" />
                    {problem.teamPreference.replace('_', ' ').toLowerCase()}
                    {problem.minTeamSize && problem.maxTeamSize && ` (${problem.minTeamSize}-${problem.maxTeamSize} members)`}
                  </div>
                </div>

                {problem.estimatedDurationWeeks && (
                  <div>
                    <h4 className="text-xs font-bold text-[#5B5F73] uppercase tracking-wider mb-1">Duration</h4>
                    <div className="flex items-center text-sm text-[#1C1C1E] font-medium">
                      <Clock className="w-4 h-4 mr-2 text-[#5B5F73]" />
                      {problem.estimatedDurationWeeks} Weeks
                    </div>
                  </div>
                )}

                {problem.geographicScope && (
                  <div>
                    <h4 className="text-xs font-bold text-[#5B5F73] uppercase tracking-wider mb-1">Geographic Scope</h4>
                    <div className="flex items-center text-sm text-[#1C1C1E] font-medium capitalize">
                      <MapPin className="w-4 h-4 mr-2 text-[#5B5F73]" />
                      {problem.geographicScope.toLowerCase()}
                      {problem.state && `, ${problem.state}`}
                    </div>
                  </div>
                )}

                {problem.funding?.fundingEnabled && (
                  <div>
                    <h4 className="text-xs font-bold text-[#5B5F73] uppercase tracking-wider mb-1">Funding</h4>
                    <div className="flex items-center text-sm text-emerald-600 font-medium">
                      <Coins className="w-4 h-4 mr-2 text-emerald-600" />
                      {problem.funding.fundingAmount ? `₹${problem.funding.fundingAmount}` : 'Funding Available'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-xl p-6">
              <h3 className="font-bold text-[#1C1C1E] mb-4">Required Skills</h3>
              <div className="space-y-3">
                {problem.skills?.map((skill, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-[#1C1C1E] font-medium">{skill.name}</span>
                    <span className="text-xs text-[#5B5F73] capitalize">{skill.minimumLevel.toLowerCase()}</span>
                  </div>
                ))}
                {(!problem.skills || problem.skills.length === 0) && (
                  <p className="text-sm text-[#5B5F73]">No specific skills required.</p>
                )}
              </div>

              {problem.tags && problem.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[#5B5F73]/20">
                  <h3 className="text-xs font-bold text-[#5B5F73] uppercase tracking-wider mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {problem.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-[#5B5F73]/10 text-[#5B5F73] rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {problem.sdgs && problem.sdgs.length > 0 && (
              <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-xl p-6">
                <h3 className="font-bold text-[#1C1C1E] mb-4">Impact Goals</h3>
                <div className="space-y-3">
                  {problem.sdgs.map(sdgId => {
                    const sdg = SDGs.find(s => s.id === sdgId);
                    if (!sdg) return null;
                    return (
                      <div key={sdg.id} className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded shrink-0 flex items-center justify-center text-white font-bold text-[10px]"
                          style={{ backgroundColor: sdg.color }}
                        >
                          {sdg.id}
                        </div>
                        <span className="text-sm text-[#5B5F73] font-medium leading-tight">{sdg.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
