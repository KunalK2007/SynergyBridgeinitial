"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { MentorAnalytics } from "@/types/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Activity, Briefcase, CheckCircle, AlertTriangle, Clock } from "lucide-react";

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

  // Suppress unused import warning
  void Clock;

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Mentor Intelligence</CardTitle></CardHeader>
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
    <Card className="mb-8 border-[#9C7A4C]/20">
      <CardHeader className="bg-[#9C7A4C]/5 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Mentor Intelligence</CardTitle>
          <span className={`px-2 py-1 text-xs font-bold rounded-full border ${
            data.capacityStatus === "AVAILABLE" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
            data.capacityStatus === "OVER_CAPACITY" ? "bg-red-100 text-red-700 border-red-200" :
            "bg-amber-100 text-amber-700 border-amber-200"
          }`}>
            {data.capacityStatus.replace("_", " ")}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-4 bg-[#F6F5F2] rounded-lg border border-[#5B5F73]/15 shadow-sm">
            <Briefcase className="w-5 h-5 text-[#9C7A4C] mb-2" />
            <span className="text-2xl font-bold text-[#1C1C1E]">{data.activeProjects.available ? data.activeProjects.value : "--"} <span className="text-sm font-normal text-[#5B5F73]">/ {data.maxActiveProjects.value}</span></span>
            <span className="text-xs text-[#5B5F73]">Active Projects</span>
          </div>

          <div className="flex flex-col items-center p-4 bg-[#F6F5F2] rounded-lg border border-[#5B5F73]/15 shadow-sm">
            <Activity className="w-5 h-5 text-[#5B5F73] mb-2" />
            <span className="text-2xl font-bold text-[#1C1C1E]">{data.averageProgress.available ? `${Math.round(data.averageProgress.value as number)}%` : "--"}</span>
            <span className="text-xs text-[#5B5F73]">Avg Progress</span>
          </div>

          <div className="flex flex-col items-center p-4 bg-[#F6F5F2] rounded-lg border border-[#5B5F73]/15 shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600 mb-2" />
            <span className="text-2xl font-bold text-[#1C1C1E]">{data.completedProjects.available ? data.completedProjects.value : "--"}</span>
            <span className="text-xs text-[#5B5F73]">Completed</span>
          </div>

          <div className="flex flex-col items-center p-4 bg-[#F6F5F2] rounded-lg border border-[#5B5F73]/15 shadow-sm">
            <AlertTriangle className={`w-5 h-5 mb-2 ${(data.atRiskProjects.value || 0) > 0 ? "text-red-500" : "text-[#5B5F73]"}`} />
            <span className="text-2xl font-bold text-[#1C1C1E]">{data.atRiskProjects.available ? data.atRiskProjects.value : "--"}</span>
            <span className="text-xs text-[#5B5F73]">At-Risk Projects</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
