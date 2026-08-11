"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { signupSchema, SignupFormValues } from "@/lib/validation/auth";
import { UserRole, AccountStatus } from "@/types/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: UserRole.STUDENT,
    }
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      // 1. Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // 2. Update auth profile
      await updateProfile(user, { displayName: data.name });

      // 3. Determine initial status based on role
      const needsApproval = [UserRole.INDUSTRY, UserRole.GOVERNMENT, UserRole.FACULTY, UserRole.INCUBATION].includes(data.role);
      const accountStatus = needsApproval ? AccountStatus.PENDING : AccountStatus.ACTIVE;

      // 4. Create user document in Firestore
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: data.email,
        displayName: data.name,
        role: data.role,
        accountStatus: accountStatus,
        profileCompleted: false,
        createdAt: now,
        updatedAt: now,
      });

      // 5. Send email verification
      await sendEmailVerification(user);

      toast.success("Account created! Please check your email to verify.");
      
      if (needsApproval) {
        router.push("/pending-approval");
      } else {
        router.push("/verify-email");
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
        <CardDescription className="text-center">
          Join SynergyBridge to start innovating
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Full Name</label>
            <Input
              placeholder="John Doe"
              {...register("name")}
              error={errors.name?.message}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Email</label>
            <Input
              type="email"
              placeholder="m@example.com"
              {...register("email")}
              error={errors.email?.message}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Password</label>
            <Input
              type="password"
              {...register("password")}
              error={errors.password?.message}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-200">Role</label>
            <select
              {...register("role")}
              className="flex h-10 w-full rounded-md border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:border-purple-500 transition-colors duration-200 appearance-none"
            >
              <option className="bg-slate-900 text-slate-100" value={UserRole.STUDENT}>Student</option>
              <option className="bg-slate-900 text-slate-100" value={UserRole.MENTOR}>Mentor</option>
              <option className="bg-slate-900 text-slate-100" value={UserRole.INDUSTRY}>Industry Partner</option>
              <option className="bg-slate-900 text-slate-100" value={UserRole.GOVERNMENT}>Government Official</option>
              <option className="bg-slate-900 text-slate-100" value={UserRole.FACULTY}>Faculty Coordinator</option>
              <option className="bg-slate-900 text-slate-100" value={UserRole.INCUBATION}>Incubation Partner</option>
            </select>
            {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>}
          </div>
          <Button className="w-full" type="submit" isLoading={isLoading}>
            Sign Up
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 hover:underline">
            Log in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
