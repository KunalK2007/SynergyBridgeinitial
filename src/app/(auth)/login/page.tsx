"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { loginSchema, LoginFormValues } from "@/lib/validation/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success("Successfully logged in!");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Login</CardTitle>
        <CardDescription className="text-center">
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-[#1C1C1E] peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
            <Input
              type="email"
              placeholder="m@example.com"
              {...register("email")}
              error={errors.email?.message}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none text-[#1C1C1E] peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
              <Link href="/forgot-password" className="text-sm text-[#9C7A4C] hover:text-[#7A6039] hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              {...register("password")}
              error={errors.password?.message}
            />
          </div>
          <Button className="w-full" type="submit" isLoading={isLoading}>
            Sign In
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-[#5B5F73]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#9C7A4C] hover:text-[#7A6039] hover:underline">
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
