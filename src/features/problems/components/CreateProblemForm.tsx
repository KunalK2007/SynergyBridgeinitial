"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { problemSchema, ProblemFormValues } from "@/lib/validation/problem";
import { Problem, TeamPreference } from "@/types/problem";
import { UserRole } from "@/types/auth";
import { useLeaveConfirm } from "@/hooks/use-leave-confirm";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Info } from "lucide-react";

// Steps
import Step1Basics from "./steps/Step1Basics";
import Step2Details from "./steps/Step2Details";
import Step3DNA from "./steps/Step3DNA";
import Step4Impact from "./steps/Step4Impact";
import Step5Constraints from "./steps/Step5Constraints";
import Step6Review from "./steps/Step6Review";
import { ProblemQualityMeter } from "./ProblemQualityMeter";

const steps = [
  "Basics",
  "Details",
  "Problem DNA",
  "Impact",
  "Constraints",
  "Review & Publish"
];

export function CreateProblemForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedProblemId, setSavedProblemId] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdParam = searchParams.get("id");
  const { currentUser, getIdToken } = useAuth();

  const methods = useForm<ProblemFormValues>({
    resolver: zodResolver(problemSchema) as any,
    defaultValues: {
      title: "",
      shortDescription: "",
      problemStatement: "",
      whyItMatters: "",
      expectedOutcome: "",
      successCriteria: [],
      skills: [],
      tags: [],
      sdgs: [],
      targetBeneficiaries: [],
      constraints: [],
      teamPreference: TeamPreference.ANY,
      funding: { fundingEnabled: false }
    },
    mode: "onChange"
  });

  const { formState: { isDirty } } = methods;
  useLeaveConfirm(isDirty && currentStep < steps.length - 1);

  // Load existing draft if ID provided
  useEffect(() => {
    async function loadExistingDraft() {
      if (!draftIdParam || !currentUser) return;
      setIsLoadingDraft(true);
      try {
        const snap = await getDoc(doc(db, "problems", draftIdParam));
        if (snap.exists()) {
          const problemData = snap.data() as Problem;
          if (problemData.posterId === currentUser.uid || currentUser.role === UserRole.ADMIN) {
            setSavedProblemId(problemData.id || snap.id || draftIdParam);
            methods.reset({
              title: problemData.title || "",
              shortDescription: problemData.shortDescription || "",
              problemStatement: problemData.problemStatement || "",
              whyItMatters: problemData.whyItMatters || "",
              expectedOutcome: problemData.expectedOutcome || "",
              successCriteria: problemData.successCriteria || [],
              domain: problemData.domain || "",
              subDomain: problemData.subDomain || "",
              problemType: problemData.problemType,
              difficulty: problemData.difficulty,
              skills: problemData.skills || [],
              tags: problemData.tags || [],
              sdgs: problemData.sdgs || [],
              targetBeneficiaries: problemData.targetBeneficiaries || [],
              geographicScope: problemData.geographicScope,
              region: problemData.region || "",
              district: problemData.district || "",
              state: problemData.state || "",
              country: problemData.country || "",
              constraints: problemData.constraints || [],
              teamPreference: problemData.teamPreference || TeamPreference.ANY,
              minTeamSize: problemData.minTeamSize,
              maxTeamSize: problemData.maxTeamSize,
              estimatedDurationWeeks: problemData.estimatedDurationWeeks,
              funding: problemData.funding || { fundingEnabled: false }
            });
            toast.success("Draft loaded!");
          }
        }
      } catch (err) {
        console.error("Failed to load draft:", err);
      } finally {
        setIsLoadingDraft(false);
      }
    }

    loadExistingDraft();
  }, [draftIdParam, currentUser, methods]);

  const handleNext = async () => {
    let fieldsToValidate: (keyof ProblemFormValues)[] = [];
    
    switch (currentStep) {
      case 0:
        fieldsToValidate = ['title', 'shortDescription', 'problemType', 'domain', 'difficulty'];
        break;
      case 1:
        fieldsToValidate = ['problemStatement', 'whyItMatters', 'expectedOutcome', 'successCriteria'];
        break;
      case 2:
        fieldsToValidate = ['skills', 'tags'];
        break;
      case 3:
        fieldsToValidate = ['targetBeneficiaries', 'sdgs', 'geographicScope'];
        break;
      case 4:
        fieldsToValidate = ['constraints', 'teamPreference', 'minTeamSize', 'maxTeamSize', 'estimatedDurationWeeks'];
        break;
    }

    const isStepValid = await methods.trigger(fieldsToValidate);
    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    } else {
      toast.error("Please fill all required fields in this step before proceeding.");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const cleanFormData = useCallback((raw: ProblemFormValues) => {
    return {
      ...raw,
      successCriteria: (raw.successCriteria || []).filter(c => typeof c === 'string' && c.trim().length > 0),
      targetBeneficiaries: (raw.targetBeneficiaries || []).filter(b => typeof b === 'string' && b.trim().length > 0),
      skills: (raw.skills || []).filter(s => s && typeof s.name === 'string' && s.name.trim().length > 0 && typeof s.skillId === 'string' && s.skillId.trim().length > 0),
      constraints: (raw.constraints || []).filter(c => c && typeof c.description === 'string' && c.description.trim().length > 0),
      tags: (raw.tags || []).filter(t => typeof t === 'string' && t.trim().length > 0),
    };
  }, []);

  const saveProblem = async (action: "DRAFT" | "PUBLISH") => {
    if (!currentUser) {
      toast.error("You must be logged in to save or submit a problem.");
      return;
    }

    if (isSubmitting) return;

    // For publish, validate complete form
    if (action === "PUBLISH") {
      const isFormValid = await methods.trigger();
      if (!isFormValid) {
        toast.error("Please complete all required fields across all steps before publishing.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const token = await getIdToken();
      if (!token) {
        toast.error("Authentication session expired. Please sign in again.");
        return;
      }

      const rawValues = methods.getValues();
      const formData = cleanFormData(rawValues);

      const payload = {
        action,
        problemId: savedProblemId || draftIdParam || undefined,
        data: formData,
      };

      const res = await fetch("/api/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || data.details || "Failed to save problem");
        return;
      }

      const newProblemId = data.problemId;
      if (newProblemId) {
        setSavedProblemId(newProblemId);
      }

      if (action === "PUBLISH") {
        if (currentUser.role === UserRole.STUDENT) {
          toast.success("Problem proposal submitted for review!");
          router.push("/dashboard/problems");
        } else {
          toast.success("Problem published successfully!");
          router.push(`/explore/problems/${newProblemId}`);
        }
      } else {
        toast.success("Draft saved successfully!");
        if (typeof window !== "undefined" && newProblemId) {
          try {
            const currentUrl = new URL(window.location.href);
            if (!currentUrl.searchParams.get("id")) {
              currentUrl.searchParams.set("id", newProblemId);
              window.history.replaceState(null, "", currentUrl.toString());
            }
          } catch {
            // Ignore URL update errors
          }
        }
      }
    } catch (error) {
      console.error("Save problem error:", error);
      toast.error("An unexpected error occurred while saving the problem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentValues = methods.watch();
  const isStudent = currentUser?.role === UserRole.STUDENT;

  if (isLoadingDraft) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
        Loading problem draft...
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">

        {/* Role Notice */}
        {isStudent && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-sm text-[#1C1C1E] shadow-sm">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-950 text-sm">Student Innovation Mode</p>
              <p className="text-xs text-blue-900/90 mt-1 leading-relaxed">
                As a student, submitting this challenge creates a <strong className="font-semibold text-blue-950">Problem Proposal</strong>. It will be saved as a draft and submitted to faculty/mentors for verification before public listing.
              </p>
            </div>
          </div>
        )}

        {/* Progress Stepper */}
        <div className="mb-8 bg-white border border-[#9C7A4C]/20 p-4 sm:p-5 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-3.5 gap-1">
            {steps.map((label, idx) => {
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;

              return (
                <div 
                  key={label} 
                  className={`flex-1 text-center transition-all ${
                    isActive
                      ? 'text-[#9C7A4C] font-bold'
                      : isCompleted
                      ? 'text-emerald-700 font-semibold'
                      : 'text-[#5B5F73] font-medium'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                    ) : (
                      <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                        isActive ? "bg-[#9C7A4C] text-white" : "bg-[#EFEDE8] text-[#5B5F73]"
                      }`}>
                        {idx + 1}
                      </span>
                    )}
                    <span className="truncate">{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-2 bg-[#EFEDE8] rounded-full border border-[#9C7A4C]/10" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-[#9C7A4C] to-[#7A6039] rounded-full transition-all duration-300 shadow-xs"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Container */}
        <FormProvider {...methods}>
          <form className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <div className="min-h-[400px]">
              {currentStep === 0 && <Step1Basics />}
              {currentStep === 1 && <Step2Details />}
              {currentStep === 2 && <Step3DNA />}
              {currentStep === 3 && <Step4Impact />}
              {currentStep === 4 && <Step5Constraints />}
              {currentStep === 5 && <Step6Review data={currentValues} />}
            </div>

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-800">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleBack} 
                disabled={currentStep === 0 || isSubmitting}
                className="text-slate-300 hover:text-white hover:bg-slate-800 disabled:text-slate-600"
              >
                Back
              </Button>
              
              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => saveProblem("DRAFT")}
                  disabled={isSubmitting}
                  className="text-slate-200 border-slate-700 bg-slate-800/80 hover:bg-slate-800 hover:text-white"
                >
                  Save Draft
                </Button>
                
                {currentStep < steps.length - 1 ? (
                  <Button type="button" onClick={handleNext} className="bg-[#9C7A4C] hover:bg-[#7A6039] text-white">
                    Next Step
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={() => saveProblem("PUBLISH")}
                    isLoading={isSubmitting}
                    className="bg-[#9C7A4C] hover:bg-[#7A6039] text-white"
                  >
                    {isStudent ? "Submit for Review" : "Publish Problem"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </FormProvider>
      </div>

      {/* Sidebar / Quality Meter */}
      <div className="w-full lg:w-80 space-y-4">
        <div className="sticky top-6">
          <ProblemQualityMeter problem={currentValues as Partial<Problem>} />
        </div>
      </div>
    </div>
  );
}
