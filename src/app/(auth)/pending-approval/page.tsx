"use client";

import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Clock } from "lucide-react";

export default function PendingApprovalPage() {
  const { currentUser, logout } = useAuth();

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <Clock className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Account Pending Approval</CardTitle>
        <CardDescription className="text-center">
          Your account is currently under review by our administration team.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-slate-900 p-4 border border-slate-800">
          <p className="text-sm text-slate-300">
            As a <strong>{currentUser?.role || "user"}</strong> on SynergyBridge, your account requires manual verification before you can access the platform. 
            This process typically takes 1-2 business days.
          </p>
          <p className="text-sm text-slate-300 mt-2">
            We will notify you via email at <strong>{currentUser?.email}</strong> once your account has been approved.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={() => logout()}>
          Sign Out
        </Button>
      </CardFooter>
    </Card>
  );
}
