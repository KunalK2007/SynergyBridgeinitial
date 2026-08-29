"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { InstitutionAnalytics } from "@/types/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Users, FileText, CheckCircle, Percent, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function InstitutionAnalyticsPage() {
  const { currentUser: user, getIdToken } = useAuth();
  const [data, setData] = useState<InstitutionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchAnalytics = async () => {
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch("/api/analytics/institution", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setData(await res.json());
        } else {
          setError(await res.text());
        }
      } catch (err) {
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user, getIdToken]);

  const handleExport = async () => {
    if (!user) return;
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch("/api/analytics/institution/export", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "institution_analytics.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-red-500">
          <p>{error || "No data available."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Institution Analytics</h1>
          <p className="text-[#5B5F73]">Overview of participation, outcomes, and ecosystem impact.</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.studentCount.available ? data.studentCount.value : <span className="text-sm font-normal text-slate-500">{data.studentCount.reason?.replace("_", " ")}</span>}
            </div>
            <p className="text-xs text-muted-foreground">Enrolled in platform</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Match Ready Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.matchReadyRate.available ? `${Math.round(data.matchReadyRate.value as number)}%` : <span className="text-sm font-normal text-slate-500">{data.matchReadyRate.reason?.replace("_", " ")}</span>}
            </div>
            <p className="text-xs text-muted-foreground">Students with complete profiles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Started</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.activeProjectCount.available ? data.activeProjectCount.value : <span className="text-sm font-normal text-slate-500">{data.activeProjectCount.reason?.replace("_", " ")}</span>}
            </div>
            <p className="text-xs text-muted-foreground">Currently active projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.completionRate.available ? `${Math.round(data.completionRate.value as number)}%` : <span className="text-sm font-normal text-slate-500">{data.completionRate.reason?.replace("_", " ")}</span>}
            </div>
            <p className="text-xs text-muted-foreground">Successful project completion</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Outcome Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Applications Submitted</span>
                <span className="font-medium">{data.outcomeFunnel.applicationsSubmitted.available ? data.outcomeFunnel.applicationsSubmitted.value : "--"}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Applications Accepted</span>
                <span className="font-medium">{data.outcomeFunnel.applicationsAccepted.available ? data.outcomeFunnel.applicationsAccepted.value : "--"}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Projects Started</span>
                <span className="font-medium">{data.outcomeFunnel.projectsStarted.available ? data.outcomeFunnel.projectsStarted.value : "--"}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Projects Completed</span>
                <span className="font-medium">{data.outcomeFunnel.projectsCompleted.available ? data.outcomeFunnel.projectsCompleted.value : "--"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Certificates Issued</span>
                <span className="font-medium">{data.outcomeFunnel.certificatesIssued.available ? data.outcomeFunnel.certificatesIssued.value : "--"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-emerald-600 font-medium">On Track</span>
                <span className="font-bold">{data.healthDistribution.onTrack.available ? data.healthDistribution.onTrack.value : "--"}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-amber-600 font-medium">At Risk</span>
                <span className="font-bold">{data.healthDistribution.atRisk.available ? data.healthDistribution.atRisk.value : "--"}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-red-600 font-medium">Stalled</span>
                <span className="font-bold">{data.healthDistribution.stalled.available ? data.healthDistribution.stalled.value : "--"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
