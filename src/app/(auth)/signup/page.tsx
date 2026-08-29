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
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: data.name });

      const needsApproval = [UserRole.INDUSTRY, UserRole.GOVERNMENT, UserRole.FACULTY, UserRole.INCUBATION].includes(data.role);
      const accountStatus = needsApproval ? AccountStatus.PENDING : AccountStatus.ACTIVE;

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
            <label className="text-sm font-medium leading-none text-[#1C1C1E]">Full Name</label>
            <Input
              placeholder="John Doe"
              {...register("name")}
              error={errors.name?.message}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-[#1C1C1E]">Email</label>
            <Input
              type="email"
              placeholder="m@example.com"
              {...register("email")}
              error={errors.email?.message}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-[#1C1C1E]">Password</label>
            <Input
              type="password"
              {...register("password")}
              error={errors.password?.message}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-[#1C1C1E]">Role</label>
            <select
              {...register("role")}
              className="flex h-10 w-full rounded-md border border-[#5B5F73]/50 bg-[#F6F5F2] px-3 py-2 text-sm text-[#1C1C1E] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9C7A4C]/50 focus-visible:border-[#9C7A4C] transition-colors duration-200 appearance-none"
            >
              <option className="bg-[#F6F5F2] text-[#1C1C1E]" value={UserRole.STUDENT}>Student</option>
              <option className="bg-[#F6F5F2] text-[#1C1C1E]" value={UserRole.MENTOR}>Mentor</option>
              <option className="bg-[#F6F5F2] text-[#1C1C1E]" value={UserRole.INDUSTRY}>Industry Partner</option>
              <option className="bg-[#F6F5F2] text-[#1C1C1E]" value={UserRole.GOVERNMENT}>Government Official</option>
              <option className="bg-[#F6F5F2] text-[#1C1C1E]" value={UserRole.FACULTY}>Faculty Coordinator</option>
              <option className="bg-[#F6F5F2] text-[#1C1C1E]" value={UserRole.INCUBATION}>Incubation Partner</option>
            </select>
            {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>}
          </div>
          <Button className="w-full" type="submit" isLoading={isLoading}>
            Sign Up
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-[#5B5F73]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#9C7A4C] hover:text-[#7A6039] hover:underline">
            Log in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
