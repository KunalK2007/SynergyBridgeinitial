/* eslint-disable @typescript-eslint/no-explicit-any */
import { useFormContext, useFieldArray } from "react-hook-form";
import { ConstraintType, TeamPreference } from "@/types/problem";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Step5Constraints() {
  const { register, control, formState: { errors } } = useFormContext();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "constraints"
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Constraints & Timeline</h2>
        <p className="text-slate-300 text-sm">Set the boundaries, logistics, and timeline for this challenge.</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Execution Constraints</h3>
              <p className="text-xs text-slate-400">Add any limitations (budget, hardware, connectivity, etc.)</p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => append({ type: ConstraintType.OTHER, description: "", severity: "MEDIUM" })}
              className="text-slate-100 border-slate-600 bg-slate-800/90 hover:bg-slate-700 hover:text-white shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4 mr-2 text-slate-100" />
              Add Constraint
            </Button>
          </div>
          
          <div className="space-y-4">
            {fields.map((item, index) => (
              <div key={item.id} className="bg-slate-800/70 p-4 rounded-lg border border-slate-700 relative">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => remove(index)}
                  className="absolute top-2 right-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pr-10">
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Type</label>
                    <select
                      {...register(`constraints.${index}.type`)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.values(ConstraintType).map(type => (
                        <option key={type} value={type} className="text-slate-100 bg-slate-800">
                          {type.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-6 space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Description</label>
                    <input
                      {...register(`constraints.${index}.description`)}
                      placeholder="e.g. Must run entirely offline without internet"
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {((errors?.constraints as Record<string, any>)?.[index]?.description?.message) && (
                      <p className="text-xs text-red-400 mt-1">{((errors.constraints as Record<string, any>)[index].description.message)}</p>
                    )}
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Severity</label>
                    <select
                      {...register(`constraints.${index}.severity`)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="LOW" className="text-slate-100 bg-slate-800">Low</option>
                      <option value="MEDIUM" className="text-slate-100 bg-slate-800">Medium</option>
                      <option value="HIGH" className="text-slate-100 bg-slate-800">High (Dealbreaker)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {fields.length === 0 && (
              <div className="text-center py-6 bg-slate-800/40 rounded-lg border border-slate-700 border-dashed">
                <p className="text-sm text-slate-300">No constraints added (optional).</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Team Preferences & Sizing</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">
                Team Type <span className="text-red-400">*</span>
              </label>
              <select
                {...register("teamPreference")}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(TeamPreference).map(pref => (
                  <option key={pref} value={pref} className="text-slate-100 bg-slate-800">
                    {pref.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Min Team Size</label>
              <input
                type="number"
                min="1"
                {...register("minTeamSize")}
                placeholder="e.g. 2"
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Max Team Size</label>
              <input
                type="number"
                min="1"
                max="20"
                {...register("maxTeamSize")}
                placeholder="e.g. 5"
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.maxTeamSize && <p className="text-xs text-red-400 mt-1">{errors.maxTeamSize.message as string}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
