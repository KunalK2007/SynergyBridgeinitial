import Link from "next/link";
import { Problem } from "@/types/problem";
import { BadgeCheck, MapPin, Users, Calendar, Coins } from "lucide-react";

export function ProblemCard({ problem }: { problem: Problem }) {
  const isVerified = problem.verificationStatus === "VERIFIED";

  return (
    <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 hover:border-[#9C7A4C]/40 transition-colors rounded-xl overflow-hidden flex flex-col">
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2 items-center flex-wrap">
            <span className="px-2 py-1 bg-[#9C7A4C]/10 text-[#9C7A4C] text-xs font-semibold rounded uppercase tracking-wider">
              {problem.problemType.replace('_', ' ')}
            </span>
            <span className="text-xs text-[#5B5F73] font-medium">
              {problem.domain}
            </span>
          </div>
          {isVerified && (
            <div className="flex items-center text-emerald-600 bg-emerald-100 px-2 py-1 rounded text-xs font-medium" title="This problem has been reviewed and verified by SynergyBridge.">
              <BadgeCheck className="w-3 h-3 mr-1" />
              Verified
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold text-[#1C1C1E] mb-2 line-clamp-2">
          {problem.title}
        </h3>
        <p className="text-sm text-[#5B5F73] mb-4 line-clamp-2 flex-1">
          {problem.shortDescription}
        </p>

        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-[#5B5F73]/10 text-[#5B5F73] rounded text-xs font-medium capitalize">
              {problem.difficulty.toLowerCase()}
            </span>
            {problem.skills?.filter(s => s.requirementType === 'REQUIRED').slice(0, 3).map((skill, i) => (
              <span key={i} className="px-2 py-1 bg-[#9C7A4C]/10 border border-[#9C7A4C]/20 text-[#9C7A4C] rounded text-xs font-medium">
                {skill.name}
              </span>
            ))}
            {problem.skills && problem.skills.filter(s => s.requirementType === 'REQUIRED').length > 3 && (
              <span className="px-2 py-1 bg-[#5B5F73]/10 text-[#5B5F73] rounded text-xs font-medium">
                +{problem.skills.filter(s => s.requirementType === 'REQUIRED').length - 3} more
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#5B5F73]">
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
              <div className="flex items-center text-emerald-600">
                <Coins className="w-3 h-3 mr-1.5" />
                {problem.funding.fundingAmount ? `₹${problem.funding.fundingAmount}` : 'Funded'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-[#5B5F73]/15 bg-[#F6F5F2]/60 flex justify-between items-center">
        <div className="text-xs text-[#5B5F73]">
          Posted by {problem.organizationName || 'Unknown'}
        </div>
        <Link
          href={`/explore/problems/${problem.id}`}
          className="text-sm font-medium text-[#9C7A4C] hover:text-[#7A6039] transition-colors"
        >
          View Challenge →
        </Link>
      </div>
    </div>
  );
}
