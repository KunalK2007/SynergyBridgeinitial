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
        <p className="text-slate-400">Set the boundaries, logistics, and timeline for this challenge.</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-sm font-medium text-slate-200">Constraints</h3>
              <p className="text-xs text-slate-400">Add any limitations (budget, hardware, connectivity, etc.)</p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => append({ type: ConstraintType.OTHER, description: "", severity: "MEDIUM" })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Constraint
            </Button>
          </div>
          
          <div className="space-y-4">
            {fields.map((item, index) => (
              <div key={item.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 relative">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => remove(index)}
                  className="absolute top-2 right-2 text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pr-10">
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-xs font-medium text-slate-300">Type</label>
                    <select
                      {...register(`constraints.${index}.type`)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100"
                    >
                      {Object.values(ConstraintType).map(type => (
                        <option key={type} value={type}>{type.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-6 space-y-1">
                    <label className="text-xs font-medium text-slate-300">Description</label>
                    <input
                      {...register(`constraints.${index}.description`)}
                      placeholder="e.g. Must run entirely offline"
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:ring-blue-500"
                    />
                    {((errors?.constraints as Record<string, any>)?.[index]?.description?.message) && (
                      <p className="text-xs text-red-500">{((errors.constraints as Record<string, any>)[index].description.message)}</p>
                    )}
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-xs font-medium text-slate-300">Severity</label>
                    <select
                      {...register(`constraints.${index}.severity`)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High (Dealbreaker)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {fields.length === 0 && (
              <div className="text-center py-6 bg-slate-800/30 rounded-lg border border-slate-800 border-dashed">
                <p className="text-sm text-slate-400">No constraints added.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div>
            <h3 className="text-sm font-medium text-slate-200">Team Preferences</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Team Type <span className="text-red-500">*</span></label>
              <select
                {...register("teamPreference")}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(TeamPreference).map(pref => (
                  <option key={pref} value={pref}>{pref.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Min Size</label>
              <input
                type="number"
                {...register("minTeamSize", { valueAsNumber: true })}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Max Size</label>
              <input
                type="number"
                {...register("maxTeamSize", { valueAsNumber: true })}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100"
              />
              {errors.maxTeamSize && <p className="text-xs text-red-500">{errors.maxTeamSize.message as string}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div>
            <h3 className="text-sm font-medium text-slate-200">Timeline</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Duration (Weeks)</label>
              <input
                type="number"
                {...register("estimatedDurationWeeks", { valueAsNumber: true })}
                placeholder="e.g. 12"
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
