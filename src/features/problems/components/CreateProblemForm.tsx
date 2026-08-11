"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { problemSchema, ProblemFormValues } from "@/lib/validation/problem";
import { Problem, ProblemStatus, VerificationStatus } from "@/types/problem";
import { useLeaveConfirm } from "@/hooks/use-leave-confirm";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";

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
  const router = useRouter();
  const { currentUser } = useAuth();

  const methods = useForm<ProblemFormValues>({
    resolver: zodResolver(problemSchema),
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
      funding: { fundingEnabled: false }
    },
    mode: "onChange"
  });

  const { formState: { isDirty } } = methods;
  useLeaveConfirm(isDirty && currentStep < steps.length - 1);

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
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const saveProblem = async (status: ProblemStatus) => {
    if (!currentUser) return;
    
    // For publish, validate everything
    if (status === ProblemStatus.PUBLISHED) {
      const isFormValid = await methods.trigger();
      if (!isFormValid) {
        toast.error("Please fill all required fields correctly.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const data = methods.getValues();
      const problemRef = doc(collection(db, "problems"));
      
      const now = Date.now();
      
      const problemDoc = {
        id: problemRef.id,
        ...data,
        status,
        visibility: status === ProblemStatus.PUBLISHED ? "PUBLIC" : "PRIVATE",
        posterId: currentUser.uid,
        posterRole: currentUser.role,
        organizationName: currentUser.displayName, // fallback
        verificationStatus: VerificationStatus.UNVERIFIED,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(problemRef, problemDoc);
      
      toast.success(status === ProblemStatus.DRAFT ? "Draft saved successfully!" : "Problem published successfully!");
      router.push("/dashboard/problems");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save problem");
    } finally {
      setIsSubmitting(false);
    }
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const currentValues = methods.watch();

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {steps.map((label, idx) => (
              <div 
                key={label} 
                className={`flex-1 text-center text-sm font-medium ${idx <= currentStep ? 'text-blue-500' : 'text-slate-500'}`}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 rounded-full" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Container */}
        <FormProvider {...methods}>
          <form className="bg-slate-900 border border-slate-800 rounded-xl p-6">
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
              >
                Back
              </Button>
              
              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => saveProblem(ProblemStatus.DRAFT)}
                  disabled={isSubmitting}
                >
                  Save Draft
                </Button>
                
                {currentStep < steps.length - 1 ? (
                  <Button type="button" onClick={handleNext}>
                    Next Step
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={() => saveProblem(ProblemStatus.PUBLISHED)}
                    isLoading={isSubmitting}
                  >
                    Publish Problem
                  </Button>
                )}
              </div>
            </div>
          </form>
        </FormProvider>
      </div>

      {/* Sidebar / Quality Meter */}
      <div className="w-full lg:w-80">
        <div className="sticky top-6">
          <ProblemQualityMeter problem={currentValues as Partial<Problem>} />
        </div>
      </div>
    </div>
  );
}
