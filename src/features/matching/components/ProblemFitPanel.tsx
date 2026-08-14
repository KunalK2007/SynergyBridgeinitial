"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Problem } from "@/types/problem";
import { calculateProblemFit, ProblemFitResult } from "@/lib/utils/matching-engine";
import { normalizeStudentProfile } from "@/lib/utils/profile-helpers";
import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

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
      <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-xl p-6 text-[#5B5F73] animate-pulse">
        Analyzing SynergyBridge Fit...
      </div>
    );
  }

  if (!fit) return null;

  let matchLabel = "Potential Match";
  let colorClass = "text-amber-600";
  let ringClass = "border-amber-400";
  let lightBgClass = "bg-amber-50";

  if (fit.score >= 70) {
    matchLabel = "Strong Match";
    colorClass = "text-emerald-600";
    ringClass = "border-emerald-400";
    lightBgClass = "bg-emerald-50";
  } else if (fit.score >= 50) {
    matchLabel = "Good Match";
    colorClass = "text-[#9C7A4C]";
    ringClass = "border-[#9C7A4C]";
    lightBgClass = "bg-[#9C7A4C]/5";
  }

  return (
    <div className={`border rounded-xl p-6 mb-8 ${lightBgClass} ${ringClass}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1C1C1E] tracking-tight">SynergyBridge FIT</h2>
          <p className={`text-lg font-semibold mt-1 ${colorClass}`}>{matchLabel}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-4xl font-extrabold text-[#1C1C1E]">{fit.score}%</div>
          <div className="text-xs text-[#5B5F73] mt-1">Confidence: <span className="font-medium text-[#1C1C1E]">{fit.confidence}</span></div>
        </div>
      </div>

      <div className="space-y-6">

        {/* WHY MATCHED */}
        <div>
          <h3 className="text-sm font-bold text-[#5B5F73] uppercase tracking-wider mb-3">Why this match?</h3>
          {fit.explanation.length === 0 && fit.strengths.length === 0 ? (
            <p className="text-sm text-[#5B5F73]">Not enough data to explain this match.</p>
          ) : (
            <div className="space-y-2 text-sm text-[#5B5F73]">
              {fit.explanation.map((exp, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-[#5B5F73]/50">•</span>
                  <span>{exp}</span>
                </div>
              ))}
              {fit.strengths.map((strength, idx) => (
                <div key={idx} className="flex gap-2 items-start text-emerald-600">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SKILL GAPS */}
        {fit.gaps.length > 0 && (
          <div className="pt-4 border-t border-[#5B5F73]/20">
            <h3 className="text-sm font-bold text-[#5B5F73] uppercase tracking-wider mb-3">Skill Gaps</h3>
            <div className="space-y-3">
              {fit.gaps.map((gap, idx) => (
                <div key={idx} className="flex gap-2 items-start text-sm">
                  {gap.type === "MISSING" ? (
                    <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                  )}
                  <div>
                    <p className="font-medium text-[#1C1C1E]">
                      {gap.skillName} <span className="text-xs ml-1 px-1.5 py-0.5 bg-[#5B5F73]/10 rounded text-[#5B5F73]">{gap.type}</span>
                    </p>
                    <p className="text-xs text-[#5B5F73] mt-1">
                      Required: <span className="capitalize text-[#1C1C1E]">{gap.requiredLevel.toLowerCase()}</span>
                      {gap.studentLevel && (
                        <> | Current: <span className="capitalize text-[#1C1C1E]">{gap.studentLevel.toLowerCase()}</span></>
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
