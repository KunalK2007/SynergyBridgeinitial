import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { ProblemType, DifficultyLevel } from "@/types/problem";
import { DOMAINS } from "@/lib/constants/taxonomy";

export default function Step1Basics() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Problem Basics</h2>
        <p className="text-slate-400">Start with the fundamental details of your challenge.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Title <span className="text-red-500">*</span></label>
          <Input 
            {...register("title")} 
            placeholder="e.g. AI-powered Crop Disease Detection"
            error={errors.title?.message as string}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Short Description <span className="text-red-500">*</span></label>
          <Input 
            {...register("shortDescription")} 
            placeholder="A one-sentence summary of the challenge."
            error={errors.shortDescription?.message as string}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Problem Type <span className="text-red-500">*</span></label>
            <select 
              {...register("problemType")}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Type...</option>
              {Object.values(ProblemType).map(type => (
                <option key={type} value={type}>{type.replace('_', ' ')}</option>
              ))}
            </select>
            {errors.problemType && <p className="text-xs text-red-500">{errors.problemType.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Domain <span className="text-red-500">*</span></label>
            <select 
              {...register("domain")}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Domain...</option>
              {DOMAINS.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
            {errors.domain && <p className="text-xs text-red-500">{errors.domain.message as string}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Difficulty <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { value: DifficultyLevel.BEGINNER, desc: "Foundational knowledge" },
              { value: DifficultyLevel.INTERMEDIATE, desc: "Practical experience" },
              { value: DifficultyLevel.ADVANCED, desc: "Independent problem-solving" },
              { value: DifficultyLevel.EXPERT, desc: "Research-heavy/Multidisciplinary" }
            ].map((level) => (
              <label 
                key={level.value} 
                className="flex items-start space-x-3 p-3 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500 transition-colors"
              >
                <input 
                  type="radio" 
                  value={level.value}
                  {...register("difficulty")}
                  className="mt-1 bg-slate-800 border-slate-600 text-blue-500 focus:ring-blue-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-200 capitalize">{level.value.toLowerCase()}</span>
                  <span className="text-xs text-slate-400">{level.desc}</span>
                </div>
              </label>
            ))}
          </div>
          {errors.difficulty && <p className="text-xs text-red-500">{errors.difficulty.message as string}</p>}
        </div>

      </div>
    </div>
  );
}
