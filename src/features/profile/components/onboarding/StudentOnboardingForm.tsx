/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { studentProfileSchema, StudentProfileFormValues } from "@/lib/validation/profile";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import toast from "react-hot-toast";
import { triggerGamificationEvent } from "@/lib/utils/gamification-client";
import { GamificationEventType } from "@/types/gamification";

import { Step1Academic } from "./Step1Academic";
import { Step2Skills } from "./Step2Skills";
import { Step3Interests } from "./Step3Interests";
import { Step4Review } from "./Step4Review";
import { StudentProfile } from "@/types/profile";

const STEPS = [
  { id: "academic", title: "Academic Profile" },
  { id: "skills", title: "Capability Builder" },
  { id: "interests", title: "Interests & Domains" },
  { id: "review", title: "Review & Complete" },
];

interface Props {
  initialData?: Partial<StudentProfile>;
  isEditMode?: boolean;
}

export function StudentOnboardingForm({ initialData, isEditMode = false }: Props) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<StudentProfileFormValues>({
    resolver: zodResolver(studentProfileSchema) as any,
    defaultValues: {
      institutionId: initialData?.institutionId || "",
      department: initialData?.department || "",
      course: initialData?.course || "",
      year: initialData?.year,
      semester: initialData?.semester,
      skills: (initialData?.skills as any) || [],
      interests: initialData?.interests || [],
      preferredDomains: initialData?.preferredDomains || [],
      resumeUrl: initialData?.resumeUrl || "",
      shareResumeWithApplicants: initialData?.shareResumeWithApplicants || false,
    },
    mode: "onChange",
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof StudentProfileFormValues)[] = [];
    
    if (currentStep === 0) {
      fieldsToValidate = ["institutionId", "department", "course", "year", "semester"];
    } else if (currentStep === 1) {
      fieldsToValidate = ["skills"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["interests", "preferredDomains"];
    }

    const isValid = await methods.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const onSubmit = async (data: StudentProfileFormValues) => {
    if (!currentUser) return;
    setIsSubmitting(true);

    try {
      const profileRef = doc(db, "studentProfiles", currentUser.uid);
      
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      
      const payload = {
        userId: currentUser.uid,
        ...data,
        updatedAt: now,
      };

      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        await updateDoc(profileRef, payload);
      } else {
        await setDoc(profileRef, { ...payload, createdAt: now });
      }

      // Mark user profile as completed if it wasn't
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { profileCompleted: true });

      // Trigger gamification event
      triggerGamificationEvent(GamificationEventType.PROFILE_COMPLETED, currentUser.uid);

      if (!isEditMode && data.skills && data.skills.length > 0) {
        triggerGamificationEvent(GamificationEventType.SKILLS_ADDED, currentUser.uid);
      }

      toast.success(isEditMode ? "Profile updated successfully!" : "Onboarding complete!");
      
      if (!isEditMode) {
        router.push("/dashboard/student");
      }
    } catch (error) {
      console.error("Error saving profile", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, idx) => (
              <div
                key={step.id}
                className={`flex-1 h-2 mx-1 rounded-full ${
                  idx <= currentStep ? "bg-indigo-500" : "bg-slate-800"
                }`}
              />
            ))}
          </div>
          <CardTitle className="text-2xl">{STEPS[currentStep].title}</CardTitle>
          <CardDescription>
            Step {currentStep + 1} of {STEPS.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && <Step1Academic />}
          {currentStep === 1 && <Step2Skills />}
          {currentStep === 2 && <Step3Interests />}
          {currentStep === 3 && <Step4Review />}
        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-800 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
          >
            Back
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={methods.handleSubmit(onSubmit as any)} isLoading={isSubmitting}>
              {isEditMode ? "Save Changes" : "Complete Profile"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </FormProvider>
  );
}
