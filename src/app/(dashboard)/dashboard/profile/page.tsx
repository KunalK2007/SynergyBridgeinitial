"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import toast from "react-hot-toast";
import { UserRole } from "@/types/auth";
import { getDoc } from "firebase/firestore";
import { useEffect } from "react";
import { StudentProfile } from "@/types/profile";
import { StudentOnboardingForm } from "@/features/profile/components/onboarding/StudentOnboardingForm";
import { normalizeStudentProfile } from "@/lib/utils/profile-helpers";

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  showOnLeaderboard: z.boolean().optional(),
  // Note: Further fields like skills, org, etc., can be added based on role in later phases
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { currentUser, firebaseUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [studentData, setStudentData] = useState<Partial<StudentProfile> | null>(null);
  const [fetchingStudent, setFetchingStudent] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: currentUser?.displayName || "",
      showOnLeaderboard: true,
    },
  });

  useEffect(() => {
    if (currentUser?.role === UserRole.STUDENT) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFetchingStudent(true);
      getDoc(doc(db, "studentProfiles", currentUser.uid))
        .then(snap => {
          if (snap.exists()) {
            setStudentData(normalizeStudentProfile(snap.data()));
          } else {
            setStudentData({}); // Empty to trigger form
          }
        })
        .finally(() => setFetchingStudent(false));
        
      // Fetch gamification profile for settings
      getDoc(doc(db, "gamificationProfiles", currentUser.uid)).then(snap => {
        if (snap.exists()) {
          setValue("showOnLeaderboard", snap.data().showOnLeaderboard ?? true);
        }
      });
    }
  }, [currentUser, setValue]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!currentUser || !firebaseUser) return;
    setIsLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(firebaseUser, { displayName: data.displayName });
      
      // Update Firestore user document
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        displayName: data.displayName,
        updatedAt: now,
      });

      // Update gamification privacy setting if student
      if (currentUser.role === UserRole.STUDENT) {
        const gamificationRef = doc(db, "gamificationProfiles", currentUser.uid);
        const gamificationSnap = await getDoc(gamificationRef);
        if (gamificationSnap.exists()) {
          await updateDoc(gamificationRef, {
            showOnLeaderboard: data.showOnLeaderboard,
          });
        }
      }

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Profile</h1>
        <p className="text-slate-400">Manage your personal information and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Update your display name and view your account details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Email Address</label>
              <Input
                type="email"
                value={currentUser?.email || ""}
                disabled
                className="bg-slate-800/50 cursor-not-allowed text-slate-400"
              />
              <p className="text-xs text-slate-500">Your email cannot be changed at this time.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Display Name</label>
              <Input
                {...register("displayName")}
                error={errors.displayName?.message}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Role</label>
              <Input
                value={currentUser?.role || ""}
                disabled
                className="bg-slate-800/50 cursor-not-allowed text-slate-400 capitalize"
              />
            </div>
            
            {currentUser?.role === UserRole.STUDENT && (
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="showOnLeaderboard"
                  {...register("showOnLeaderboard")}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="showOnLeaderboard" className="text-sm font-medium leading-none text-slate-300">
                  Show my profile on public leaderboards
                </label>
              </div>
            )}

            <Button type="submit" isLoading={isLoading}>
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {currentUser?.role === UserRole.STUDENT && (
        <div className="pt-8 border-t border-slate-800">
          <h2 className="text-2xl font-bold text-white mb-6">Capability Profile</h2>
          {fetchingStudent ? (
            <div className="text-slate-400">Loading your profile data...</div>
          ) : (
            studentData && <StudentOnboardingForm initialData={studentData} isEditMode={true} />
          )}
        </div>
      )}
    </div>
  );
}
