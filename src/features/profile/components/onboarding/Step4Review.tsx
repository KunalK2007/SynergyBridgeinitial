/* eslint-disable @typescript-eslint/no-explicit-any */
import { useFormContext } from "react-hook-form";
import { StudentProfileFormValues } from "@/lib/validation/profile";
import { calculateStudentProfileCompleteness, isStudentProfileMatchReady } from "@/lib/utils/profile-helpers";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function Step4Review() {
  const { watch } = useFormContext<StudentProfileFormValues>();
  const data = watch();

  const completeness = calculateStudentProfileCompleteness(data);
  const isMatchReady = isStudentProfileMatchReady(data);

  return (
    <div className="space-y-6">
      
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
        <h3 className="text-xl font-bold text-white mb-2">PROFILE READINESS</h3>
        
        <div className="w-full bg-slate-800 rounded-full h-4 mb-4 overflow-hidden relative max-w-sm mx-auto">
          <div 
            className={`h-4 transition-all duration-1000 ${completeness >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${completeness}%` }}
          />
        </div>
        
        <p className="text-2xl font-bold text-white mb-6">{completeness}%</p>

        <div className="space-y-3 max-w-md mx-auto text-left">
          <div className="flex items-center gap-3">
            {data.institutionId ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-slate-500" />}
            <span className={data.institutionId ? "text-slate-300" : "text-slate-500"}>Academic information</span>
          </div>
          <div className="flex items-center gap-3">
            {data.skills.length >= 3 ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-slate-500" />}
            <span className={data.skills.length >= 3 ? "text-slate-300" : "text-slate-500"}>
              {data.skills.length} skills added (3 recommended)
            </span>
          </div>
          <div className="flex items-center gap-3">
            {data.skills.length > 0 && data.skills.every((s: any) => s.level !== undefined && !s.needsConfirmation) ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-slate-500" />
            )}
            <span className={data.skills.every((s: any) => s.level !== undefined && !s.needsConfirmation) ? "text-slate-300" : "text-slate-500"}>
              Skill proficiency provided
            </span>
          </div>
          <div className="flex items-center gap-3">
            {data.preferredDomains.length > 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-slate-500" />}
            <span className={data.preferredDomains.length > 0 ? "text-slate-300" : "text-slate-500"}>Preferred domains selected</span>
          </div>
        </div>
      </div>

      {isMatchReady ? (
        <div className="p-4 bg-emerald-900/30 border border-emerald-800 rounded-lg text-emerald-400 flex gap-3 items-start">
          <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p>Your profile meets the minimum requirements and is ready for problem matching. You can update these details anytime from your dashboard.</p>
        </div>
      ) : (
        <div className="p-4 bg-amber-900/30 border border-amber-800 rounded-lg text-amber-400 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p>Your profile is missing key information required for matching. You can still complete onboarding, but you won&apos;t be matched until you provide proficiency levels for your skills and select at least one domain.</p>
        </div>
      )}

      {/* Resume visibility opt-in */}
      <div className="pt-4 border-t border-slate-800">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input 
            type="checkbox"
            className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
            {...useFormContext().register("shareResumeWithApplicants")}
          />
          <div>
            <p className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">Make resume visible to problem posters</p>
            <p className="text-xs text-slate-400 mt-1">If enabled, posters of problems you apply to will be able to view your resume. Your profile otherwise remains private.</p>
          </div>
        </label>
      </div>

    </div>
  );
}
