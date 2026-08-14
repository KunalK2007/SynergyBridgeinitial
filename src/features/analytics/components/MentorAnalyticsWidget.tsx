"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { MentorAnalytics } from "@/types/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Activity, AlertTriangle, Briefcase, CheckCircle, Clock } from "lucide-react";

export function MentorAnalyticsWidget() {
  const { currentUser: user, getIdToken } = useAuth();
  const [data, setData] = useState<MentorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAnalytics = async () => {
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch("/api/analytics/mentor", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch mentor analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user, getIdToken]);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Mentorship Overview</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl text-[#1C1C1E] dark:text-[#F3F4F6]">Mentorship Workspace Analytics</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5B5F73] dark:text-[#9499AD]">Capacity Status:</span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            data.capacityStatus === "AVAILABLE" ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300" :
            data.capacityStatus === "NEAR_CAPACITY" ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300" :
            "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300"
          }`}>
            {data.capacityStatus.replace("_", " ")}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-4 bg-[#F6F5F2] dark:bg-[#1A1E2E] rounded-lg border border-[#5B5F73]/15 dark:border-[#252A3D] shadow-sm">
            <Briefcase className="w-5 h-5 text-[#9C7A4C] dark:text-[#C4A880] mb-2" />
            <span className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">{data.activeProjects.available ? data.activeProjects.value : "--"} <span className="text-sm font-normal text-[#5B5F73] dark:text-[#9499AD]">/ {data.maxActiveProjects.value}</span></span>
            <span className="text-xs text-[#5B5F73] dark:text-[#9499AD]">Active Projects</span>
          </div>

          <div className="flex flex-col items-center p-4 bg-[#F6F5F2] dark:bg-[#1A1E2E] rounded-lg border border-[#5B5F73]/15 dark:border-[#252A3D] shadow-sm">
            <Activity className="w-5 h-5 text-[#5B5F73] dark:text-[#9499AD] mb-2" />
            <span className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">{data.averageProgress.available ? `${Math.round(data.averageProgress.value as number)}%` : "--"}</span>
            <span className="text-xs text-[#5B5F73] dark:text-[#9499AD]">Avg Progress</span>
          </div>

          <div className="flex flex-col items-center p-4 bg-[#F6F5F2] dark:bg-[#1A1E2E] rounded-lg border border-[#5B5F73]/15 dark:border-[#252A3D] shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
            <span className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">{data.completedProjects.available ? data.completedProjects.value : "--"}</span>
            <span className="text-xs text-[#5B5F73] dark:text-[#9499AD]">Completed</span>
          </div>

          <div className="flex flex-col items-center p-4 bg-[#F6F5F2] dark:bg-[#1A1E2E] rounded-lg border border-[#5B5F73]/15 dark:border-[#252A3D] shadow-sm">
            <AlertTriangle className={`w-5 h-5 mb-2 ${(data.atRiskProjects.value || 0) > 0 ? "text-red-500" : "text-[#5B5F73] dark:text-[#9499AD]"}`} />
            <span className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">{data.atRiskProjects.available ? data.atRiskProjects.value : "--"}</span>
            <span className="text-xs text-[#5B5F73] dark:text-[#9499AD]">At-Risk Projects</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
