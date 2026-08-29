import { ProblemFormValues } from "@/lib/validation/problem";

export default function Step6Review({ data }: { data: Partial<ProblemFormValues> }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Review & Publish</h2>
        <p className="text-slate-300 text-sm">Review your problem details before publishing to the platform repository.</p>
      </div>

      <div className="space-y-8 bg-slate-950 p-6 sm:p-8 rounded-xl border border-slate-700/80 shadow-md">
        
        {/* Header Section */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex gap-2 items-center mb-3">
            <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold rounded uppercase tracking-wider">
              {data.problemType?.replace('_', ' ')}
            </span>
            <span className="px-2.5 py-1 bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold rounded">
              {data.domain}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{data.title || "Untitled Problem"}</h1>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">{data.shortDescription}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <section className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Problem Statement</h3>
              <p className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                {data.problemStatement || "Not specified"}
              </p>
            </section>
            
            <section className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expected Outcome</h3>
              <p className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                {data.expectedOutcome || "Not specified"}
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {data.skills?.filter(s => s.requirementType === 'REQUIRED').map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-900/40 border border-blue-700/60 text-blue-200 rounded-full text-xs font-semibold">
                    {s.name} • {s.minimumLevel}
                  </span>
                ))}
                {(!data.skills || data.skills.filter(s => s.requirementType === 'REQUIRED').length === 0) && (
                  <span className="text-xs text-slate-400 italic">No required skills specified</span>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-5 bg-slate-900 p-5 rounded-lg border border-slate-700/80">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Difficulty</h4>
              <p className="text-sm text-white font-semibold capitalize">{data.difficulty?.toLowerCase() || "Not specified"}</p>
            </div>
            
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duration</h4>
              <p className="text-sm text-white font-semibold">{data.estimatedDurationWeeks ? `${data.estimatedDurationWeeks} Weeks` : 'Not specified'}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Team Preference</h4>
              <p className="text-sm text-white font-semibold capitalize">
                {data.teamPreference?.replace('_', ' ').toLowerCase() || "Any"}
                {data.minTeamSize && data.maxTeamSize && ` (${data.minTeamSize}-${data.maxTeamSize} members)`}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Scope</h4>
              <p className="text-sm text-white font-semibold capitalize">{data.geographicScope?.toLowerCase() || "Global"}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
