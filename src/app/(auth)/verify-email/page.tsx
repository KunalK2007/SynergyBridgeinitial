"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { sendEmailVerification } from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import toast from "react-hot-toast";

export default function VerifyEmailPage() {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!firebaseUser) {
        router.push("/login");
      } else if (firebaseUser.emailVerified) {
        router.push("/dashboard");
      }
    }
  }, [firebaseUser, loading, router]);

  const handleResend = async () => {
    if (!firebaseUser) return;
    setIsResending(true);
    try {
      await sendEmailVerification(firebaseUser);
      toast.success("Verification email resent!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to resend email. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Verify your email</CardTitle>
        <CardDescription className="text-center">
          We&apos;ve sent a verification link to {firebaseUser?.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-center text-sm text-slate-400">
          Please check your inbox and click the link to verify your account. If you haven&apos;t received the email, you can request a new one below.
        </p>
        <div className="flex flex-col space-y-3">
          <Button onClick={handleRefresh}>
            I have verified my email
          </Button>
          <Button variant="outline" onClick={handleResend} isLoading={isResending}>
            Resend verification email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
