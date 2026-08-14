"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { StudentAnalytics } from "@/types/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Award, Briefcase, CheckCircle, Flame, Target, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function StudentAnalyticsWidget() {
  const { currentUser: user, getIdToken } = useAuth();
  const [data, setData] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAnalytics = async () => {
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch("/api/analytics/student", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch student analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user, getIdToken]);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>SynergyBridge Outcomes</CardTitle></CardHeader>
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
      <CardHeader>
        <CardTitle className="text-xl">SynergyBridge Outcomes &amp; Impact</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="flex flex-col items-center p-3 bg-[#F6F5F2] rounded-lg border border-[#5B5F73]/15">
            <Target className="w-5 h-5 text-[#9C7A4C] mb-2" />
            <span className="text-2xl font-bold text-[#1C1C1E]">{data.averageFitScore.available ? `${Math.round(data.averageFitScore.value as number)}%` : "--"}</span>
            <span className="text-xs text-[#5B5F73]">Avg Fit Score</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-[#F6F5F2] rounded-lg border border-[#5B5F73]/15">
            <FileText className="w-5 h-5 text-[#5B5F73] mb-2" />
            <span className="text-2xl font-bold text-[#1C1C1E]">{data.applicationsSubmitted.available ? data.applicationsSubmitted.value : "--"}</span>
            <span className="text-xs text-[#5B5F73]">Applications</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-[#F6F5F2] rounded-lg border border-[#5B5F73]/15">
            <Briefcase className="w-5 h-5 text-amber-600 mb-2" />
            <span className="text-2xl font-bold text-[#1C1C1E]">{data.projectsActive.available ? data.projectsActive.value : "--"}</span>
            <span className="text-xs text-[#5B5F73]">Active Projects</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-[#F6F5F2] rounded-lg border border-[#5B5F73]/15">
            <CheckCircle className="w-5 h-5 text-emerald-600 mb-2" />
            <span className="text-2xl font-bold text-[#1C1C1E]">{data.projectsCompleted.available ? data.projectsCompleted.value : "--"}</span>
            <span className="text-xs text-[#5B5F73]">Completed Projects</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-[#F6F5F2] rounded-lg border border-[#5B5F73]/15">
            <Award className="w-5 h-5 text-yellow-500 mb-2" />
            <span className="text-2xl font-bold text-[#1C1C1E]">{data.certificatesIssued.available ? data.certificatesIssued.value : "--"}</span>
            <span className="text-xs text-[#5B5F73]">Certificates</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-[#F6F5F2] rounded-lg border border-[#5B5F73]/15">
            <Flame className="w-5 h-5 text-red-500 mb-2" />
            <span className="text-2xl font-bold text-[#1C1C1E]">{data.currentStreak.available ? data.currentStreak.value : "--"}</span>
            <span className="text-xs text-[#5B5F73]">Day Streak</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 p-4 bg-[#9C7A4C]/5 rounded-lg border border-[#9C7A4C]/10">
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-[#1C1C1E] mb-1">Boost Your Impact</h4>
            <p className="text-xs text-[#5B5F73] mb-3">
              {data.profileCompleteness.value === 100
                ? "Your profile is fully complete. Explore new problems to match your highest fit score!"
                : `Your profile is only ${data.profileCompleteness.value}% complete. Update your skills to improve your match rate.`}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Link href="/dashboard/problems">Find Problems</Link>
              </Button>
              <Button size="sm" variant="default">
                <Link href="/dashboard/mentor">Ask AI Mentor</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
