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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-400 animate-pulse">
        Analyzing SynergyBridge Fit...
      </div>
    );
  }

  // Only show panel if a student profile exists and fit was calculated
  if (!fit) return null;

  let matchLabel = "Potential Match";
  let colorClass = "text-amber-400";
  let ringClass = "border-amber-400";
  let lightBgClass = "bg-amber-900/20";
  
  if (fit.score >= 70) {
    matchLabel = "Strong Match";
    colorClass = "text-emerald-400";
    ringClass = "border-emerald-400";
    lightBgClass = "bg-emerald-900/20";
  } else if (fit.score >= 50) {
    matchLabel = "Good Match";
    colorClass = "text-blue-400";
    ringClass = "border-blue-400";
    lightBgClass = "bg-blue-900/20";
  }

  return (
    <div className={`border rounded-xl p-6 mb-8 ${lightBgClass} ${ringClass}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">SynergyBridge FIT</h2>
          <p className={`text-lg font-semibold mt-1 ${colorClass}`}>{matchLabel}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-4xl font-extrabold text-white">{fit.score}%</div>
          <div className="text-xs text-slate-400 mt-1">Confidence: <span className="font-medium text-slate-300">{fit.confidence}</span></div>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* WHY MATCHED */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Why this match?</h3>
          {fit.explanation.length === 0 && fit.strengths.length === 0 ? (
            <p className="text-sm text-slate-500">Not enough data to explain this match.</p>
          ) : (
            <div className="space-y-2 text-sm text-slate-300">
              {fit.explanation.map((exp, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-slate-500">•</span>
                  <span>{exp}</span>
                </div>
              ))}
              {fit.strengths.map((strength, idx) => (
                <div key={idx} className="flex gap-2 items-start text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SKILL GAPS */}
        {fit.gaps.length > 0 && (
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Skill Gaps</h3>
            <div className="space-y-3">
              {fit.gaps.map((gap, idx) => (
                <div key={idx} className="flex gap-2 items-start text-sm">
                  {gap.type === "MISSING" ? (
                    <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                  )}
                  <div>
                    <p className="font-medium text-slate-200">
                      {gap.skillName} <span className="text-xs ml-1 px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">{gap.type}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Required: <span className="capitalize text-slate-300">{gap.requiredLevel.toLowerCase()}</span>
                      {gap.studentLevel && (
                        <> | Current: <span className="capitalize text-slate-300">{gap.studentLevel.toLowerCase()}</span></>
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
