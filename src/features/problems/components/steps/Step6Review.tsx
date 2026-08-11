import { ProblemFormValues } from "@/lib/validation/problem";

export default function Step6Review({ data }: { data: Partial<ProblemFormValues> }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Review & Publish</h2>
        <p className="text-slate-400">Review your problem details before publishing to the repository.</p>
      </div>

      <div className="space-y-8 bg-slate-950 p-6 rounded-xl border border-slate-800">
        
        {/* Header Section */}
        <div>
          <div className="flex gap-2 items-center mb-2">
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded uppercase tracking-wider">
              {data.problemType?.replace('_', ' ')}
            </span>
            <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs font-medium rounded">
              {data.domain}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{data.title || "Untitled Problem"}</h1>
          <p className="text-slate-300 text-sm leading-relaxed">{data.shortDescription}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Problem Statement</h3>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{data.problemStatement}</p>
            </section>
            
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Expected Outcome</h3>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{data.expectedOutcome}</p>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {data.skills?.filter(s => s.requirementType === 'REQUIRED').map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-900/30 border border-blue-800/50 text-blue-400 rounded-full text-xs font-medium">
                    {s.name} • {s.minimumLevel}
                  </span>
                ))}
                {data.skills?.filter(s => s.requirementType === 'REQUIRED').length === 0 && (
                  <span className="text-sm text-slate-500">No required skills specified</span>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Difficulty</h4>
              <p className="text-sm text-white font-medium capitalize">{data.difficulty?.toLowerCase()}</p>
            </div>
            
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</h4>
              <p className="text-sm text-white font-medium">{data.estimatedDurationWeeks ? `${data.estimatedDurationWeeks} Weeks` : 'Not specified'}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Team Preference</h4>
              <p className="text-sm text-white font-medium capitalize">
                {data.teamPreference?.replace('_', ' ').toLowerCase()}
                {data.minTeamSize && data.maxTeamSize && ` (${data.minTeamSize}-${data.maxTeamSize} members)`}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Scope</h4>
              <p className="text-sm text-white font-medium capitalize">{data.geographicScope?.toLowerCase()}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
