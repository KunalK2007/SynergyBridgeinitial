"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Problem } from "@/types/problem";
import { calculateProblemFit, ProblemFitResult } from "@/lib/utils/matching-engine";
import { normalizeStudentProfile } from "@/lib/utils/profile-helpers";
import { CheckCircle2, AlertTriangle, ShieldAlert, Sparkles } from "lucide-react";

export function ProblemFitPanel({ problem }: { problem: Problem }) {
  const { currentUser } = useAuth();
  const [fit, setFit] = useState<ProblemFitResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFit() {
      if (!currentUser || currentUser.role !== "STUDENT") {
        setIsLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "studentProfiles", currentUser.uid));
        if (snap.exists()) {
          const profile = normalizeStudentProfile(snap.data());
          const fitResult = calculateProblemFit(profile, problem);
          setFit(fitResult);
        }
      } catch (err) {
        console.error("Failed to calculate fit", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFit();
  }, [currentUser, problem]);

  if (isLoading) {
    return (
      <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-xl p-5 text-[#5B5F73] text-sm animate-pulse">
        Analyzing SynergyBridge Fit...
      </div>
    );
  }

  if (!fit) return null;

  let matchLabel = "Potential Match";
  let badgeColorClass = "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800";
  let ringClass = "border-amber-400 dark:border-amber-600/40";
  let lightBgClass = "bg-amber-50/70 dark:bg-amber-950/20";

  if (fit.score >= 70) {
    matchLabel = "Strong Match";
    badgeColorClass = "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
    ringClass = "border-emerald-400 dark:border-emerald-600/40";
    lightBgClass = "bg-emerald-50/70 dark:bg-emerald-950/20";
  } else if (fit.score >= 50) {
    matchLabel = "Good Match";
    badgeColorClass = "bg-[#9C7A4C]/15 dark:bg-[#9C7A4C]/25 text-[#7A6039] dark:text-[#C4A880] border-[#9C7A4C]/30 dark:border-[#9C7A4C]/50";
    ringClass = "border-[#9C7A4C]/40 dark:border-[#9C7A4C]/40";
    lightBgClass = "bg-[#9C7A4C]/5 dark:bg-[#9C7A4C]/10";
  }

  return (
    <div className={`border rounded-xl p-5 sm:p-6 mb-8 w-full max-w-full overflow-hidden shadow-sm ${lightBgClass} ${ringClass}`}>
      {/* Header & Match Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-base sm:text-lg font-bold text-[#1C1C1E] tracking-tight flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#9C7A4C]" /> SynergyBridge FIT
        </h2>
        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${badgeColorClass}`}>
          {matchLabel}
        </span>
      </div>

      {/* Score & Confidence Metric Box */}
      <div className="bg-white/80 backdrop-blur-xs rounded-xl p-4 mb-6 border border-[#5B5F73]/15 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-3xl sm:text-4xl font-black text-[#1C1C1E] tracking-tight leading-none">
              {fit.score}%
            </div>
            <div className="text-[10px] sm:text-xs font-semibold text-[#5B5F73] uppercase tracking-wider mt-1.5">
              Deterministic Match
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] text-[#5B5F73] font-medium">Confidence</div>
            <div className="inline-block text-xs font-bold text-[#1C1C1E] px-2 py-0.5 mt-0.5 rounded bg-[#EFEDE8] uppercase tracking-wide">
              {fit.confidence}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* WHY MATCHED */}
        <div>
          <h3 className="text-xs font-bold text-[#5B5F73] uppercase tracking-wider mb-2.5">Why this match?</h3>
          {fit.explanation.length === 0 && fit.strengths.length === 0 ? (
            <p className="text-xs sm:text-sm text-[#5B5F73]">Not enough data to explain this match.</p>
          ) : (
            <div className="space-y-2 text-xs sm:text-sm text-[#1C1C1E]">
              {fit.explanation.map((exp, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="text-[#9C7A4C] font-bold">•</span>
                  <span className="text-[#5B5F73] leading-relaxed">{exp}</span>
                </div>
              ))}
              {fit.strengths.map((strength, idx) => (
                <div key={idx} className="flex gap-2 items-start text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                  <span className="leading-relaxed">{strength}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SKILL GAPS */}
        {fit.gaps.length > 0 && (
          <div className="pt-4 border-t border-[#5B5F73]/15">
            <h3 className="text-xs font-bold text-[#5B5F73] uppercase tracking-wider mb-2.5">Skill Gaps</h3>
            <div className="space-y-2.5">
              {fit.gaps.map((gap, idx) => (
                <div key={idx} className="flex gap-2.5 items-start text-xs sm:text-sm">
                  {gap.type === "MISSING" ? (
                    <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1C1C1E] truncate">
                      {gap.skillName} <span className="text-[10px] ml-1 px-1.5 py-0.5 bg-[#5B5F73]/10 rounded font-bold text-[#5B5F73] uppercase">{gap.type}</span>
                    </p>
                    <p className="text-[11px] text-[#5B5F73] mt-0.5">
                      Required: <span className="capitalize font-medium text-[#1C1C1E]">{gap.requiredLevel.toLowerCase()}</span>
                      {gap.studentLevel && (
                        <> | Current: <span className="capitalize font-medium text-[#1C1C1E]">{gap.studentLevel.toLowerCase()}</span></>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
