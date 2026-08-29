import { useFormContext } from "react-hook-form";
import { ProblemType, DifficultyLevel } from "@/types/problem";
import { DOMAINS } from "@/lib/constants/taxonomy";

export default function Step1Basics() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Problem Basics</h2>
        <p className="text-slate-300 text-sm">Start with the fundamental details of your challenge.</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200">
            Title <span className="text-red-400">*</span>
          </label>
          <input 
            {...register("title")} 
            placeholder="e.g. AI-powered Crop Disease Detection"
            className={`w-full bg-slate-800 border ${errors.title ? 'border-red-500' : 'border-slate-700'} rounded-md px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200">
            Short Description <span className="text-red-400">*</span>
          </label>
          <input 
            {...register("shortDescription")} 
            placeholder="A one-sentence summary of the challenge."
            className={`w-full bg-slate-800 border ${errors.shortDescription ? 'border-red-500' : 'border-slate-700'} rounded-md px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.shortDescription && <p className="text-xs text-red-400 mt-1">{errors.shortDescription.message as string}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200">
              Problem Type <span className="text-red-400">*</span>
            </label>
            <select 
              {...register("problemType")}
              className={`w-full bg-slate-800 border ${errors.problemType ? 'border-red-500' : 'border-slate-700'} rounded-md px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="" className="text-slate-400">Select Type...</option>
              {Object.values(ProblemType).map(type => (
                <option key={type} value={type} className="text-slate-100 bg-slate-800">
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
            {errors.problemType && <p className="text-xs text-red-400">{errors.problemType.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200">
              Domain <span className="text-red-400">*</span>
            </label>
            <select 
              {...register("domain")}
              className={`w-full bg-slate-800 border ${errors.domain ? 'border-red-500' : 'border-slate-700'} rounded-md px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="" className="text-slate-400">Select Domain...</option>
              {DOMAINS.map(domain => (
                <option key={domain} value={domain} className="text-slate-100 bg-slate-800">
                  {domain}
                </option>
              ))}
            </select>
            {errors.domain && <p className="text-xs text-red-400">{errors.domain.message as string}</p>}
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-sm font-semibold text-slate-200">
            Difficulty <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { value: DifficultyLevel.BEGINNER, desc: "Foundational knowledge" },
              { value: DifficultyLevel.INTERMEDIATE, desc: "Practical experience" },
              { value: DifficultyLevel.ADVANCED, desc: "Independent problem-solving" },
              { value: DifficultyLevel.EXPERT, desc: "Research-heavy/Multidisciplinary" }
            ].map((level) => (
              <label 
                key={level.value} 
                className="flex items-start space-x-3 p-3.5 border border-slate-700 bg-slate-800/60 rounded-lg cursor-pointer hover:bg-slate-800 hover:border-slate-600 focus-within:ring-2 focus-within:ring-blue-500 transition-colors"
              >
                <input 
                  type="radio" 
                  value={level.value}
                  {...register("difficulty")}
                  className="mt-1 bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-100 capitalize">{level.value.toLowerCase()}</span>
                  <span className="text-xs text-slate-300 mt-0.5">{level.desc}</span>
                </div>
              </label>
            ))}
          </div>
          {errors.difficulty && <p className="text-xs text-red-400 mt-1">{errors.difficulty.message as string}</p>}
        </div>

      </div>
    </div>
  );
}
