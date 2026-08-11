/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { StudentProfileFormValues } from "@/lib/validation/profile";
import { SKILL_TAXONOMY } from "@/lib/constants/taxonomy";
import { SkillLevel } from "@/types/problem";
import { Input } from "@/components/ui/Input";
import { Search, X, Check } from "lucide-react";

export function Step2Skills() {
  const { control, watch } = useFormContext<StudentProfileFormValues>();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "skills",
  });
  
  const selectedSkills = watch("skills") || [];
  const [searchTerm, setSearchTerm] = useState("");

  const selectedIds = new Set(selectedSkills.map(s => s.skillId));

  const handleSelect = (skillId: string) => {
    if (!selectedIds.has(skillId)) {
      append({ skillId, level: undefined as any }); // Undefined initially requires user choice
    }
  };

  const handleRemove = (index: number) => {
    remove(index);
  };

  const handleSetLevel = (index: number, level: SkillLevel) => {
    update(index, { ...fields[index], level });
  };

  // Group and filter taxonomy
  const filteredTaxonomy = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const result: Record<string, { id: string; name: string }[]> = {};
    
    Object.entries(SKILL_TAXONOMY).forEach(([category, skills]) => {
      const matched = skills.filter(s => s.name.toLowerCase().includes(term));
      if (matched.length > 0) {
        result[category] = matched;
      }
    });
    return result;
  }, [searchTerm]);

  const levels = [
    { value: SkillLevel.BEGINNER, label: "Beginner" },
    { value: SkillLevel.INTERMEDIATE, label: "Intermediate" },
    { value: SkillLevel.ADVANCED, label: "Advanced" },
    { value: SkillLevel.EXPERT, label: "Expert" },
  ];

  const getSkillName = (id: string) => {
    for (const cat of Object.values(SKILL_TAXONOMY)) {
      const found = cat.find(s => s.id === id);
      if (found) return found.name;
    }
    return id;
  };

  return (
    <div className="space-y-6">
      
      {/* Selected Skills Capability Builder */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Selected Skills ({fields.length})</h3>
        
        {fields.length === 0 ? (
          <div className="text-slate-500 text-sm italic p-4 bg-slate-900 rounded-lg border border-slate-800 text-center">
            No skills selected yet. Search and select skills below.
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const currentLevel = watch(`skills.${index}.level`);
              
              return (
                <div key={field.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 relative">
                  <button 
                    onClick={() => handleRemove(index)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-400"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="mb-3">
                    <span className="font-medium text-white text-base">{getSkillName(field.skillId)}</span>
                    {!currentLevel && <span className="ml-2 text-xs text-amber-500 font-medium">Proficiency required</span>}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {levels.map((lvl) => {
                      const isSelected = currentLevel === lvl.value;
                      return (
                        <button
                          key={lvl.value}
                          type="button"
                          onClick={() => handleSetLevel(index, lvl.value)}
                          className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                            isSelected 
                              ? "bg-indigo-600 border-indigo-500 text-white" 
                              : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                          {lvl.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <hr className="border-slate-800" />

      {/* Taxonomy Search */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Add Capabilities</h3>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search skills (e.g. Python, React)..." 
            className="pl-9"
          />
        </div>
        
        <div className="max-h-64 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {Object.entries(filteredTaxonomy).length === 0 ? (
            <div className="text-center text-slate-500 py-4">No skills found matching your search.</div>
          ) : (
            Object.entries(filteredTaxonomy).map(([category, skills]) => (
              <div key={category}>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => {
                    const isSelected = selectedIds.has(skill.id);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        disabled={isSelected}
                        onClick={() => handleSelect(skill.id)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          isSelected
                            ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed"
                            : "bg-slate-900 border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-indigo-400"
                        }`}
                      >
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
}
