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
  const { currentUser: user } = useAuth();
  const [data, setData] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAnalytics = async () => {
      try {
        const token = await user.uid;
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
  }, [user]);

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
        <CardTitle className="text-xl">SynergyBridge Outcomes & Impact</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
            <Target className="w-5 h-5 text-blue-500 mb-2" />
            <span className="text-2xl font-bold">{data.averageFitScore.available ? `${Math.round(data.averageFitScore.value as number)}%` : "--"}</span>
            <span className="text-xs text-slate-500">Avg Fit Score</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
            <FileText className="w-5 h-5 text-indigo-500 mb-2" />
            <span className="text-2xl font-bold">{data.applicationsSubmitted.available ? data.applicationsSubmitted.value : "--"}</span>
            <span className="text-xs text-slate-500">Applications</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
            <Briefcase className="w-5 h-5 text-orange-500 mb-2" />
            <span className="text-2xl font-bold">{data.projectsActive.available ? data.projectsActive.value : "--"}</span>
            <span className="text-xs text-slate-500">Active Projects</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
            <CheckCircle className="w-5 h-5 text-green-500 mb-2" />
            <span className="text-2xl font-bold">{data.projectsCompleted.available ? data.projectsCompleted.value : "--"}</span>
            <span className="text-xs text-slate-500">Completed Projects</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
            <Award className="w-5 h-5 text-yellow-500 mb-2" />
            <span className="text-2xl font-bold">{data.certificatesIssued.available ? data.certificatesIssued.value : "--"}</span>
            <span className="text-xs text-slate-500">Certificates</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
            <Flame className="w-5 h-5 text-red-500 mb-2" />
            <span className="text-2xl font-bold">{data.currentStreak.available ? data.currentStreak.value : "--"}</span>
            <span className="text-xs text-slate-500">Day Streak</span>
          </div>
        </div>
        
        {/* Your Impact / Actionable Area */}
        <div className="flex flex-col md:flex-row gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">Boost Your Impact</h4>
            <p className="text-xs text-slate-600 mb-3">
              {data.profileCompleteness.value === 100 
                ? "Your profile is fully complete. Explore new problems to match your highest fit score!"
                : `Your profile is only ${data.profileCompleteness.value}% complete. Update your skills to improve your match rate.`}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" >
                <Link href="/dashboard/problems">Find Problems</Link>
              </Button>
              <Button size="sm" variant="default" >
                <Link href="/dashboard/mentor">Ask AI Mentor</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
