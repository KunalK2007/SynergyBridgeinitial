"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { AccountStatus } from "@/types/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, accountStatus, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (accountStatus === AccountStatus.PENDING && pathname !== "/pending-approval") {
        router.push("/pending-approval");
      } else if (pathname === "/dashboard") {
        if (role) {
          router.push(`/dashboard/${role.toLowerCase()}`);
        }
      }
    }
  }, [isAuthenticated, loading, accountStatus, pathname, role, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1E2135]">
        <Loader2 className="h-8 w-8 animate-spin text-[#9C7A4C]" />
      </div>
    );
  }

  if (!isAuthenticated || accountStatus === AccountStatus.PENDING) {
    return null;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
