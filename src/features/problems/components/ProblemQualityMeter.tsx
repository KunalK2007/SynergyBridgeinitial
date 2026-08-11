import { calculateProblemQuality, QualityResult } from "@/lib/utils/problem-quality";
import { Problem } from "@/types/problem";


export function ProblemQualityMeter({ problem }: { problem: Partial<Problem> }) {
  const result: QualityResult = calculateProblemQuality(problem);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-slate-200">Problem Quality</h3>
        <span className={`text-lg font-bold ${getScoreColor(result.score)}`}>
          {result.score}/100
        </span>
      </div>
      
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${getProgressColor(result.score)}`} 
          style={{ width: `${result.score}%` }} 
        />
      </div>

      <div className="space-y-2 mt-4">
        {result.recommendations.map((rec, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <span className="text-yellow-500 shrink-0">⚠</span>
            <span className="text-slate-400">{rec}</span>
          </div>
        ))}
        {result.score === 100 && (
          <div className="flex items-start gap-2 text-sm">
            <span className="text-green-500 shrink-0">✓</span>
            <span className="text-slate-400">Excellent! Your problem is fully detailed.</span>
          </div>
        )}
      </div>
    </div>
  );
}
