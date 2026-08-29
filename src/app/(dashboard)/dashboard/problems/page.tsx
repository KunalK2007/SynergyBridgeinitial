"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Clock, Edit3, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthContext";
import { Problem, ProblemStatus, VerificationStatus } from "@/types/problem";
import { UserRole } from "@/types/auth";

export default function ProblemsDashboardPage() {
  const { currentUser, getIdToken } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "PUBLISHED" | "DRAFT" | "PENDING_REVIEW">("ALL");

  useEffect(() => {
    async function loadProblems() {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const token = await getIdToken();
        if (!token) return;

        const res = await fetch("/api/problems", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setProblems(data.problems || []);
        }
      } catch (err) {
        console.error("Failed to load user problems:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProblems();
  }, [currentUser, getIdToken]);

  const filteredProblems = problems.filter((p) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "PUBLISHED") return p.status === ProblemStatus.PUBLISHED;
    if (activeTab === "DRAFT") return p.status === ProblemStatus.DRAFT && p.verificationStatus !== VerificationStatus.PENDING_REVIEW;
    if (activeTab === "PENDING_REVIEW") return p.verificationStatus === VerificationStatus.PENDING_REVIEW;
    return true;
  });

  const isStudent = currentUser?.role === UserRole.STUDENT;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1C1C1E] dark:text-[#F3F4F6] mb-1">
            {isStudent ? "My Problem Proposals" : "My Challenges"}
          </h1>
          <p className="text-[#5B5F73] dark:text-[#9499AD]">
            {isStudent
              ? "Manage problem proposals and suggestions submitted for review."
              : "Manage your drafted and published challenges in the repository."}
          </p>
        </div>
        <Link href="/dashboard/problems/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {isStudent ? "Propose Problem" : "Create Problem"}
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#5B5F73]/20 dark:border-[#252A3D] pb-2 overflow-x-auto">
        {[
          { id: "ALL", label: `All (${problems.length})` },
          { id: "PUBLISHED", label: `Published (${problems.filter(p => p.status === ProblemStatus.PUBLISHED).length})` },
          { id: "PENDING_REVIEW", label: `In Review (${problems.filter(p => p.verificationStatus === VerificationStatus.PENDING_REVIEW).length})` },
          { id: "DRAFT", label: `Drafts (${problems.filter(p => p.status === ProblemStatus.DRAFT && p.verificationStatus !== VerificationStatus.PENDING_REVIEW).length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[#1C1C1E] dark:bg-[#9C7A4C] text-white shadow-xs"
                : "text-[#5B5F73] dark:text-[#9499AD] hover:text-[#1C1C1E] dark:hover:text-[#F3F4F6] hover:bg-[#EFEDE8] dark:hover:bg-[#1A1E2E]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-[#5B5F73] dark:text-[#9499AD]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#9C7A4C] dark:text-[#C4A880]" />
          <p>Loading your challenges...</p>
        </div>
      ) : filteredProblems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProblems.map((problem) => {
            const isPublished = problem.status === ProblemStatus.PUBLISHED;
            const isPendingReview = problem.verificationStatus === VerificationStatus.PENDING_REVIEW;

            return (
              <div
                key={problem.id}
                className="bg-[#EFEDE8] dark:bg-[#131722] border border-[#5B5F73]/20 dark:border-[#252A3D] rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-[#9C7A4C]/10 dark:bg-[#9C7A4C]/20 text-[#9C7A4C] dark:text-[#C4A880] text-xs font-semibold rounded uppercase tracking-wider">
                      {problem.domain}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isPublished
                          ? "bg-emerald-500/10 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 dark:border-emerald-800"
                          : isPendingReview
                          ? "bg-blue-500/10 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-500/20 dark:border-blue-800"
                          : "bg-amber-500/10 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-500/20 dark:border-amber-800"
                      }`}
                    >
                      {isPublished
                        ? "PUBLISHED"
                        : isPendingReview
                        ? "UNDER REVIEW"
                        : "DRAFT"}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-[#1C1C1E] dark:text-[#F3F4F6] mb-2 line-clamp-1">
                    {problem.title || "Untitled Challenge"}
                  </h3>
                  <p className="text-sm text-[#5B5F73] dark:text-[#9499AD] line-clamp-2 mb-4">
                    {problem.shortDescription || problem.problemStatement || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#5B5F73]/10 dark:border-[#252A3D]">
                  <span className="text-xs text-[#5B5F73] dark:text-[#9499AD] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(problem.updatedAt || problem.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex gap-2">
                    {!isPublished && (
                      <Link href={`/dashboard/problems/create?id=${problem.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    )}
                    {isPublished ? (
                      <Link href={`/explore/problems/${problem.id}`}>
                        <Button size="sm">
                          View
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/explore/problems/${problem.id}`}>
                        <Button variant="ghost" size="sm">
                          Preview
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#EFEDE8] dark:bg-[#131722] border border-[#5B5F73]/20 dark:border-[#252A3D] rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#9C7A4C]/10 dark:bg-[#9C7A4C]/20 flex items-center justify-center mx-auto mb-3 text-[#9C7A4C] dark:text-[#C4A880]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium text-[#1C1C1E] dark:text-[#F3F4F6] mb-1">No challenges in this view</h3>
          <p className="text-[#5B5F73] dark:text-[#9499AD] mb-6 text-sm">
            {isStudent
              ? "You haven't submitted any problem proposals yet."
              : "Get started by posting a real-world problem for student innovator teams."}
          </p>
          <Link href="/dashboard/problems/create">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              {isStudent ? "Propose a Problem" : "Create Challenge"}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
