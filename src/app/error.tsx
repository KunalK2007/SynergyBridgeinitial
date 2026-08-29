"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error caught:", error);
  }, [error]);

  const isNetworkError = 
    error.message?.toLowerCase().includes("network") ||
    error.message?.toLowerCase().includes("fetch") ||
    error.message?.toLowerCase().includes("failed to fetch") ||
    error.message?.toLowerCase().includes("offline") ||
    error.message?.toLowerCase().includes("connection");

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl border-t-4 border-t-amber-500">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <CardTitle className="text-xl font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">
            {isNetworkError ? "Connection Interrupted" : "Something Went Wrong"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-3">
          <p className="text-sm text-[#5B5F73] dark:text-[#9499AD]">
            {isNetworkError
              ? "SynergyBridge was temporarily unable to reach the server. Your local session is protected."
              : "An unexpected condition occurred. You can retry the operation or return to the main dashboard."}
          </p>
          <div className="p-3 rounded-lg bg-[#EFEDE8]/60 dark:bg-[#1A1E2E] border border-[#5B5F73]/15 dark:border-[#252A3D] text-xs font-mono text-[#5B5F73] dark:text-[#9499AD] break-all">
            {error.message || "Unknown error"}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2.5">
          <Button
            onClick={() => reset()}
            className="flex-1 bg-[#9C7A4C] hover:bg-[#8A6A3E] text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center rounded-lg border border-[#5B5F73]/20 bg-white dark:bg-[#161926] hover:bg-[#EFEDE8]/50 dark:hover:bg-[#1E2336] text-[#1C1C1E] dark:text-[#F3F4F6] text-sm font-semibold py-2 px-4 transition-all"
          >
            <Home className="w-4 h-4 mr-2" /> Dashboard
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
