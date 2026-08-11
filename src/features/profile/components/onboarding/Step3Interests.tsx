import { useFormContext } from "react-hook-form";
import { StudentProfileFormValues } from "@/lib/validation/profile";
import { DOMAINS, SKILL_TAXONOMY } from "@/lib/constants/taxonomy";

export function Step3Interests() {
  const { watch, setValue } = useFormContext<StudentProfileFormValues>();
  
  const preferredDomains = watch("preferredDomains") || [];
  const interests = watch("interests") || []; // For interests we can use skill categories for now or allow free text. Let's use categories.

  const categories = Object.keys(SKILL_TAXONOMY);

  const toggleDomain = (domain: string) => {
    if (preferredDomains.includes(domain)) {
      setValue("preferredDomains", preferredDomains.filter(d => d !== domain), { shouldValidate: true });
    } else {
      if (preferredDomains.length < 5) {
        setValue("preferredDomains", [...preferredDomains, domain], { shouldValidate: true });
      }
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setValue("interests", interests.filter(i => i !== interest), { shouldValidate: true });
    } else {
      if (interests.length < 10) {
        setValue("interests", [...interests, interest], { shouldValidate: true });
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-white">Preferred Domains</h3>
          <p className="text-sm text-slate-400">Select up to 5 problem domains you are most interested in solving.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {DOMAINS.map(domain => {
            const isSelected = preferredDomains.includes(domain);
            return (
              <button
                key={domain}
                type="button"
                onClick={() => toggleDomain(domain)}
                disabled={!isSelected && preferredDomains.length >= 5}
                className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {domain}
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-slate-800" />

      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-white">Broad Interests</h3>
          <p className="text-sm text-slate-400">Select broad technology areas you are passionate about.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const isSelected = interests.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleInterest(category)}
                className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                  isSelected
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
