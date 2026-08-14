import { calculateProblemQuality, QualityResult } from "@/lib/utils/problem-quality";
import { Problem } from "@/types/problem";
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

export function ProblemQualityMeter({ problem }: { problem: Partial<Problem> }) {
  const result: QualityResult = calculateProblemQuality(problem);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-rose-400";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#9C7A4C]" /> Problem Quality Meter
        </h3>
        <span className={`text-lg font-black tracking-tight ${getScoreColor(result.score)}`}>
          {result.score}/100
        </span>
      </div>
      
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
        <div 
          className={`h-full transition-all duration-300 ${getProgressColor(result.score)}`} 
          style={{ width: `${result.score}%` }} 
        />
      </div>

      <div className="space-y-2.5 mt-4">
        {result.recommendations.map((rec, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{rec}</span>
          </div>
        ))}
        {result.score === 100 && (
          <div className="flex items-start gap-2 text-xs sm:text-sm text-emerald-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">Excellent! Your problem is thoroughly defined and ready for publication.</span>
          </div>
        )}
      </div>
    </div>
  );
}
