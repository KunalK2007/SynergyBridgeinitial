/* eslint-disable @typescript-eslint/no-explicit-any */
import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2 } from "lucide-react";

export default function Step2Details() {
  const { register, control, formState: { errors } } = useFormContext();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "successCriteria",
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Challenge Details</h2>
        <p className="text-slate-400">Describe the problem in depth and how success will be evaluated.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">
            Problem Statement <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-400 mb-1">What real-world problem needs to be solved?</p>
          <textarea 
            {...register("problemStatement")} 
            rows={4}
            className={`w-full bg-slate-800 border ${errors.problemStatement ? 'border-red-500' : 'border-slate-700'} rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Describe the context, the current situation, and what needs fixing..."
          />
          {errors.problemStatement && <p className="text-xs text-red-500">{errors.problemStatement.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">
            Why It Matters <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-400 mb-1">Why is solving this problem important?</p>
          <textarea 
            {...register("whyItMatters")} 
            rows={3}
            className={`w-full bg-slate-800 border ${errors.whyItMatters ? 'border-red-500' : 'border-slate-700'} rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.whyItMatters && <p className="text-xs text-red-500">{errors.whyItMatters.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">
            Expected Outcome <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-400 mb-1">What would a successful solution achieve?</p>
          <textarea 
            {...register("expectedOutcome")} 
            rows={3}
            className={`w-full bg-slate-800 border ${errors.expectedOutcome ? 'border-red-500' : 'border-slate-700'} rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.expectedOutcome && <p className="text-xs text-red-500">{errors.expectedOutcome.message as string}</p>}
        </div>

        <div className="space-y-2 border-t border-slate-800 pt-6">
          <label className="text-sm font-medium text-slate-200">
            Measurable Success Criteria <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-400 mb-2">How will teams know their solution is successful? Add specific metrics.</p>
          
          <div className="space-y-3">
            {fields.map((item, index) => (
              <div key={item.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    {...register(`successCriteria.${index}`)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Reduce processing time by 30%"
                  />
                  {((errors?.successCriteria as any)?.[index]?.message) && (
                    <p className="text-xs text-red-500 mt-1">{(errors.successCriteria as any)[index].message}</p>
                  )}
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => remove(index)}
                  className="text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => append("")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Criterion
          </Button>
          {errors.successCriteria && typeof errors.successCriteria.message === 'string' && (
            <p className="text-xs text-red-500 mt-1">{errors.successCriteria.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
