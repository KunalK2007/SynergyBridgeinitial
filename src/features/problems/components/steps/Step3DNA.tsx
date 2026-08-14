"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, X } from "lucide-react";
import { RequirementType, SkillImportance, SkillLevel } from "@/types/problem";
import { SKILL_TAXONOMY } from "@/lib/constants/taxonomy";
import { useState } from "react";

export default function Step3DNA() {
  const { register, control, setValue, watch, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "skills",
  });

  const [tagInput, setTagInput] = useState("");
  const tags: string[] = watch("tags") || [];

  const handleAddSkill = () => {
    append({
      skillId: "",
      name: "",
      category: "General",
      requirementType: RequirementType.REQUIRED,
      importance: SkillImportance.REQUIRED,
      minimumLevel: SkillLevel.INTERMEDIATE,
    });
  };

  const handleSkillSelect = (index: number, skillId: string) => {
    let foundName = "";
    let foundCategory = "General";

    for (const [category, skills] of Object.entries(SKILL_TAXONOMY)) {
      const s = skills.find((sk) => sk.id === skillId);
      if (s) {
        foundName = s.name;
        foundCategory = category;
        break;
      }
    }

    setValue(`skills.${index}.skillId`, skillId, { shouldValidate: true, shouldDirty: true });
    setValue(`skills.${index}.name`, foundName, { shouldValidate: true, shouldDirty: true });
    setValue(`skills.${index}.category`, foundCategory, { shouldValidate: true, shouldDirty: true });
  };

  const handleAddTag = () => {
    const cleanTag = tagInput.trim().toLowerCase();
    if (cleanTag && !tags.includes(cleanTag)) {
      setValue("tags", [...tags, cleanTag], { shouldValidate: true, shouldDirty: true });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      "tags",
      tags.filter((t) => t !== tagToRemove),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Problem DNA</h2>
        <p className="text-slate-300 text-sm">Define the technical requirements and skills needed to solve this.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Required & Preferred Skills</h3>
              <p className="text-xs text-slate-400">What technical skills would a successful team need?</p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleAddSkill}
              className="text-slate-100 border-slate-600 bg-slate-800/90 hover:bg-slate-700 hover:text-white shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4 mr-2 text-slate-100" />
              Add Skill
            </Button>
          </div>

          {errors.skills && typeof errors.skills.message === "string" && (
            <p className="text-xs text-red-400">{errors.skills.message}</p>
          )}

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Skill</label>
                    <select
                      {...register(`skills.${index}.skillId`)}
                      onChange={(e) => handleSkillSelect(index, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" className="text-slate-400">Select a skill...</option>
                      {Object.entries(SKILL_TAXONOMY).map(([category, skills]) => (
                        <optgroup key={category} label={category} className="bg-slate-900 text-slate-300 font-bold">
                          {skills.map((skill) => (
                            <option key={skill.id} value={skill.id} className="text-slate-100 bg-slate-800">
                              {skill.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <input type="hidden" {...register(`skills.${index}.name`)} />
                    <input type="hidden" {...register(`skills.${index}.category`)} />
                    {(errors?.skills as Record<string, any>)?.[index]?.skillId?.message && (
                      <p className="text-xs text-red-400">
                        {(errors.skills as Record<string, any>)[index].skillId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Requirement</label>
                    <select
                      {...register(`skills.${index}.requirementType`)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={RequirementType.REQUIRED} className="text-slate-100 bg-slate-800">Required</option>
                      <option value={RequirementType.PREFERRED} className="text-slate-100 bg-slate-800">Preferred</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Importance</label>
                    <select
                      {...register(`skills.${index}.importance`)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={SkillImportance.REQUIRED} className="text-slate-100 bg-slate-800">Crucial</option>
                      <option value={SkillImportance.IMPORTANT} className="text-slate-100 bg-slate-800">Important</option>
                      <option value={SkillImportance.OPTIONAL} className="text-slate-100 bg-slate-800">Optional</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Minimum Level</label>
                    <select
                      {...register(`skills.${index}.minimumLevel`)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={SkillLevel.BEGINNER} className="text-slate-100 bg-slate-800">Beginner</option>
                      <option value={SkillLevel.INTERMEDIATE} className="text-slate-100 bg-slate-800">Intermediate</option>
                      <option value={SkillLevel.ADVANCED} className="text-slate-100 bg-slate-800">Advanced</option>
                      <option value={SkillLevel.EXPERT} className="text-slate-100 bg-slate-800">Expert</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {fields.length === 0 && (
              <div className="text-center py-6 bg-slate-800/40 rounded-lg border border-slate-700 border-dashed">
                <p className="text-sm text-slate-300">No skills added yet (optional, but recommended for better team matching).</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Discovery Tags</h3>
            <p className="text-xs text-slate-400">Add keywords to help participants and mentors discover your challenge.</p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="e.g. computer-vision, iot, edge-ai (Press Enter)"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleAddTag}
              className="text-slate-100 border-slate-600 bg-slate-800/90 hover:bg-slate-700 hover:text-white px-5 shadow-xs transition-colors"
            >
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag) => (
              <div
                key={tag}
                className="bg-blue-900/40 text-blue-200 px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5 border border-blue-700/60 shadow-xs"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-blue-300 hover:text-white ml-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
