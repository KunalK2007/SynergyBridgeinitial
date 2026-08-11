/* eslint-disable @typescript-eslint/no-explicit-any */
import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2 } from "lucide-react";
import { RequirementType, SkillImportance, SkillLevel } from "@/types/problem";
import { SKILL_TAXONOMY } from "@/lib/constants/taxonomy";
import { useState } from "react";

export default function Step3DNA() {
  const { register, control, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "skills",
  });

  const [tagInput, setTagInput] = useState("");
  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control,
    name: "tags",
  });

  const handleAddSkill = () => {
    append({
      skillId: "",
      name: "",
      category: "",
      requirementType: RequirementType.REQUIRED,
      importance: SkillImportance.REQUIRED,
      minimumLevel: SkillLevel.INTERMEDIATE,
    });
  };



  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Problem DNA</h2>
        <p className="text-slate-400">Define the technical requirements and skills needed to solve this.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-sm font-medium text-slate-200">Skills</h3>
              <p className="text-xs text-slate-400">What technical skills would a successful team need?</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddSkill}>
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div>
          
          {errors.skills && typeof errors.skills.message === 'string' && (
            <p className="text-xs text-red-500">{errors.skills.message}</p>
          )}

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Skill</label>
                    <select
                      {...register(`skills.${index}.skillId`)}
                      onChange={(e) => {
                        // Also update name and category
                        const val = e.target.value;
                        let foundName = "";
                        let foundCat = "";
                        for (const [cat, skills] of Object.entries(SKILL_TAXONOMY)) {
                          const s = skills.find(sk => sk.id === val);
                          if (s) {
                            foundName = s.name;
                            foundCat = cat;
                            break;
                          }
                        }
                        // Dirty hack to register the hidden fields, normally we use setValue
                        const nameEl = document.getElementsByName(`skills.${index}.name`)[0] as HTMLInputElement;
                        const catEl = document.getElementsByName(`skills.${index}.category`)[0] as HTMLInputElement;
                        if(nameEl) { nameEl.value = foundName; nameEl.dispatchEvent(new Event('input', { bubbles: true })); }
                        if(catEl) { catEl.value = foundCat; catEl.dispatchEvent(new Event('input', { bubbles: true })); }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a skill...</option>
                      {Object.entries(SKILL_TAXONOMY).map(([category, skills]) => (
                        <optgroup key={category} label={category}>
                          {skills.map(skill => (
                            <option key={skill.id} value={skill.id}>{skill.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {/* Hidden fields for name and category */}
                    <input type="hidden" {...register(`skills.${index}.name`)} />
                    <input type="hidden" {...register(`skills.${index}.category`)} />
                    {((errors?.skills as Record<string, any>)?.[index]?.skillId?.message) && (
                      <p className="text-xs text-red-500">{((errors.skills as Record<string, any>)[index].skillId.message)}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Requirement</label>
                    <select
                      {...register(`skills.${index}.requirementType`)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100"
                    >
                      <option value={RequirementType.REQUIRED}>Required</option>
                      <option value={RequirementType.PREFERRED}>Preferred</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Importance</label>
                    <select
                      {...register(`skills.${index}.importance`)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100"
                    >
                      <option value={SkillImportance.REQUIRED}>Crucial</option>
                      <option value={SkillImportance.IMPORTANT}>Important</option>
                      <option value={SkillImportance.OPTIONAL}>Optional</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Minimum Level</label>
                    <select
                      {...register(`skills.${index}.minimumLevel`)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100"
                    >
                      <option value={SkillLevel.BEGINNER}>Beginner</option>
                      <option value={SkillLevel.INTERMEDIATE}>Intermediate</option>
                      <option value={SkillLevel.ADVANCED}>Advanced</option>
                      <option value={SkillLevel.EXPERT}>Expert</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {fields.length === 0 && (
              <div className="text-center py-6 bg-slate-800/30 rounded-lg border border-slate-800 border-dashed">
                <p className="text-sm text-slate-400">No skills added yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div>
            <h3 className="text-sm font-medium text-slate-200">Tags</h3>
            <p className="text-xs text-slate-400">Add free-form tags to help with discovery.</p>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (tagInput.trim()) {
                    appendTag(tagInput.trim().toLowerCase());
                    setTagInput("");
                  }
                }
              }}
              placeholder="e.g. computer-vision (Press Enter)"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button 
              type="button"
              variant="outline"
              onClick={() => {
                if (tagInput.trim()) {
                  appendTag(tagInput.trim().toLowerCase());
                  setTagInput("");
                }
              }}
            >
              Add
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {tagFields.map((field: Record<string, unknown>, index: number) => (
              <div key={field.id as string} className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-blue-900/50">
                <span>{String(field.value || field)}</span>
                {/* Note: React Hook Form field array for primitives is tricky, we're using a hack to display it */}
                <button 
                  type="button" 
                  onClick={() => removeTag(index)}
                  className="hover:text-blue-300 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { X } from "lucide-react";
