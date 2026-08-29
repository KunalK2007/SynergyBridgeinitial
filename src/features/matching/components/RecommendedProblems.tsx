"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Problem, ProblemStatus, VerificationStatus } from "@/types/problem";
import { calculateProblemFit, ProblemFitResult } from "@/lib/utils/matching-engine";
import { normalizeStudentProfile } from "@/lib/utils/profile-helpers";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Target, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface RecommendedProblem {
  problem: Problem;
  fit: ProblemFitResult;
}

export function RecommendedProblems() {
  const { currentUser } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchRecommendations() {
      if (!currentUser || currentUser.role !== "STUDENT") {
        setIsLoading(false);
        return;
      }
      try {
        const profileSnap = await getDoc(doc(db, "studentProfiles", currentUser.uid));
        if (!profileSnap.exists()) {
          setIsLoading(false);
          return;
        }
        const studentProfile = normalizeStudentProfile(profileSnap.data());

        const problemsRef = collection(db, "problems");
        const q = query(problemsRef, where("status", "==", ProblemStatus.PUBLISHED));
        const problemSnaps = await getDocs(q);

        const loadedRecommendations: RecommendedProblem[] = [];
        problemSnaps.forEach((docSnap) => {
          const problem = docSnap.data() as Problem;
          const fit = calculateProblemFit(studentProfile, problem);
          if (fit.score >= 30) {
            loadedRecommendations.push({ problem, fit });
          }
        });

        loadedRecommendations.sort((a, b) => {
          if (b.fit.score !== a.fit.score) return b.fit.score - a.fit.score;
          const aVerified = a.problem.verificationStatus === VerificationStatus.VERIFIED ? 1 : 0;
          const bVerified = b.problem.verificationStatus === VerificationStatus.VERIFIED ? 1 : 0;
          return bVerified - aVerified;
        });

        setRecommendations(loadedRecommendations.slice(0, 6));
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRecommendations();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[#1C1C1E] mb-4">Recommended Problems</h2>
        <div className="text-[#5B5F73]">Finding your best matches...</div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold text-[#1C1C1E] mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-[#9C7A4C]" />
        Recommended Problems
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map(({ problem, fit }) => {
          let matchLabel = "Potential Match";
          let labelColor = "text-amber-600 bg-amber-50 border-amber-200";
          if (fit.score >= 70) {
            matchLabel = "Strong Match";
            labelColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
          } else if (fit.score >= 50) {
            matchLabel = "Good Match";
            labelColor = "text-[#9C7A4C] bg-[#9C7A4C]/10 border-[#9C7A4C]/20";
          }

          const topStrengths = fit.strengths.slice(0, 2);
          const topGaps = fit.gaps.slice(0, 2);

          return (
            <Card key={problem.id} className="flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="font-medium text-[#1C1C1E] line-clamp-2 leading-tight">
                    {problem.title}
                  </h3>
                  <div className={`px-2 py-1 rounded text-xs font-semibold border whitespace-nowrap ${labelColor}`}>
                    {fit.score}%
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4 text-xs">
                  <span className="px-2 py-1 bg-[#5B5F73]/10 text-[#5B5F73] rounded">
                    {problem.domain}
                  </span>
                  <span className="px-2 py-1 bg-[#5B5F73]/10 text-[#5B5F73] rounded">
                    {problem.difficulty}
                  </span>
                  {problem.verificationStatus === VerificationStatus.VERIFIED && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-6 flex-1 text-sm">
                  {topStrengths.length > 0 && (
                    <div>
                      {topStrengths.map((str, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-emerald-600">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{str}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {topGaps.length > 0 && (
                    <div>
                      {topGaps.map((gap, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-amber-600">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">Missing/Weak: {gap.skillName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#5B5F73]/15">
                  <div className="text-xs text-[#5B5F73]">
                    Confidence: <span className="text-[#1C1C1E] font-medium">{fit.confidence}</span>
                  </div>
                  <Button onClick={() => router.push(`/explore/problems/${problem.id}`)} size="sm" variant="outline" className="text-xs">
                    View Problem
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
