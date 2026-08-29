import { useFormContext, useFieldArray } from "react-hook-form";
import { SDGs } from "@/lib/constants/taxonomy";
import { GeographicScope } from "@/types/problem";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Step4Impact() {
  const { register, watch, setValue, control, formState: { errors } } = useFormContext();
  const selectedSDGs = (watch("sdgs") as number[]) || [];
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "targetBeneficiaries"
  });

  const toggleSDG = (id: number) => {
    if (selectedSDGs.includes(id)) {
      setValue("sdgs", selectedSDGs.filter(s => s !== id), { shouldDirty: true, shouldValidate: true });
    } else {
      setValue("sdgs", [...selectedSDGs, id], { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Impact & SDGs</h2>
        <p className="text-slate-300 text-sm">How does this problem affect society and environment?</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Target Beneficiaries</h3>
            <p className="text-xs text-slate-400">Who will benefit from solving this problem?</p>
          </div>
          
          <div className="space-y-3">
            {fields.map((item, index) => (
              <div key={item.id} className="flex items-start gap-2.5">
                <input
                  {...register(`targetBeneficiaries.${index}`)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Rural farmers in drought-prone areas"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => remove(index)}
                  className="text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors shrink-0"
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
            onClick={() => append("")}
            className="text-slate-100 border-slate-600 bg-slate-800/90 hover:bg-slate-700 hover:text-white shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4 mr-2 text-slate-100" />
            Add Beneficiary
          </Button>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Sustainable Development Goals (SDGs)</h3>
            <p className="text-xs text-slate-400">Select the UN SDGs this problem addresses.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {SDGs.map((sdg) => {
              const isSelected = selectedSDGs.includes(sdg.id);
              return (
                <button
                  key={sdg.id}
                  type="button"
                  onClick={() => toggleSDG(sdg.id)}
                  className={`flex items-center gap-3 p-3.5 text-left rounded-lg border transition-all ${
                    isSelected 
                      ? 'border-blue-400 bg-blue-500/20 ring-1 ring-blue-400 shadow-xs' 
                      : 'border-slate-700 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-xs"
                    style={{ backgroundColor: sdg.color }}
                  >
                    {sdg.id}
                  </div>
                  <span className={`text-sm leading-tight font-medium ${isSelected ? 'text-white font-bold' : 'text-slate-200'}`}>
                    {sdg.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200">
              Geographic Scope <span className="text-red-400">*</span>
            </label>
            <select
              {...register("geographicScope")}
              className={`w-full md:w-1/2 bg-slate-800 border ${errors.geographicScope ? 'border-red-500' : 'border-slate-700'} rounded-md px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="" className="text-slate-400">Select scope...</option>
              {Object.values(GeographicScope).map(scope => (
                <option key={scope} value={scope} className="text-slate-100 bg-slate-800">
                  {scope}
                </option>
              ))}
            </select>
            {errors.geographicScope && <p className="text-xs text-red-400 mt-1">{errors.geographicScope.message as string}</p>}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">State (Optional)</label>
              <input
                {...register("state")}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Maharashtra"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Country (Optional)</label>
              <input
                {...register("country")}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. India"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
