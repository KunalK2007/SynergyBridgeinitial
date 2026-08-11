import Link from "next/link";
import { Problem } from "@/types/problem";
import { BadgeCheck, MapPin, Users, Calendar, Coins } from "lucide-react";

export function ProblemCard({ problem }: { problem: Problem }) {
  const isVerified = problem.verificationStatus === "VERIFIED";

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors rounded-xl overflow-hidden flex flex-col">
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2 items-center flex-wrap">
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded uppercase tracking-wider">
              {problem.problemType.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {problem.domain}
            </span>
          </div>
          {isVerified && (
            <div className="flex items-center text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-medium" title="This problem has been reviewed and verified by SynergyBridge.">
              <BadgeCheck className="w-3 h-3 mr-1" />
              Verified
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
          {problem.title}
        </h3>
        <p className="text-sm text-slate-400 mb-4 line-clamp-2 flex-1">
          {problem.shortDescription}
        </p>

        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-medium capitalize">
              {problem.difficulty.toLowerCase()}
            </span>
            {problem.skills?.filter(s => s.requirementType === 'REQUIRED').slice(0, 3).map((skill, i) => (
              <span key={i} className="px-2 py-1 bg-blue-900/30 border border-blue-800/50 text-blue-400 rounded text-xs font-medium">
                {skill.name}
              </span>
            ))}
            {problem.skills && problem.skills.filter(s => s.requirementType === 'REQUIRED').length > 3 && (
              <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs font-medium">
                +{problem.skills.filter(s => s.requirementType === 'REQUIRED').length - 3} more
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
            {problem.estimatedDurationWeeks && (
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1.5" />
                {problem.estimatedDurationWeeks} Weeks
              </div>
            )}
            <div className="flex items-center capitalize">
              <Users className="w-3 h-3 mr-1.5" />
              {problem.teamPreference.replace('_', ' ').toLowerCase()}
            </div>
            {problem.geographicScope && (
              <div className="flex items-center capitalize">
                <MapPin className="w-3 h-3 mr-1.5" />
                {problem.geographicScope.toLowerCase()}
              </div>
            )}
            {problem.funding?.fundingEnabled && (
              <div className="flex items-center text-emerald-400">
                <Coins className="w-3 h-3 mr-1.5" />
                {problem.funding.fundingAmount ? `₹${problem.funding.fundingAmount}` : 'Funded'}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center">
        <div className="text-xs text-slate-500">
          Posted by {problem.organizationName || 'Unknown'}
        </div>
        <Link 
          href={`/explore/problems/${problem.id}`}
          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          View Challenge →
        </Link>
      </div>
    </div>
  );
}
