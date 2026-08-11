"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { PlatformAnalytics } from "@/types/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Building, Users, Briefcase, Activity } from "lucide-react";

export default function PlatformAnalyticsPage() {
  const { currentUser: user } = useAuth();
  const [data, setData] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchAnalytics = async () => {
      try {
        const token = await user.uid;
        const res = await fetch("/api/analytics/platform", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setData(await res.json());
        } else {
          setError(await res.text());
        }
      } catch (err) {
        setError("Failed to load platform analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
        <p className="text-muted-foreground">Global ecosystem statistics and outcome aggregations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Institutions</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.institutionCount.available ? data.institutionCount.value : "--"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.studentCount.available ? data.studentCount.value : "--"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mentors</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.mentorCount.available ? data.mentorCount.value : "--"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fit Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.averageFitScore.available ? `${Math.round(data.averageFitScore.value as number)}%` : "--"}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Funnel & Funding */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Global Outcome Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Problems Published</span>
                <span className="font-medium">{data.outcomeFunnel.problemsPublished.available ? data.outcomeFunnel.problemsPublished.value : "--"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Applications Submitted</span>
                <span className="font-medium">{data.outcomeFunnel.applicationsSubmitted.available ? data.outcomeFunnel.applicationsSubmitted.value : "--"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Projects Started</span>
                <span className="font-medium">{data.outcomeFunnel.projectsStarted.available ? data.outcomeFunnel.projectsStarted.value : "--"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Projects Completed</span>
                <span className="font-medium">{data.outcomeFunnel.projectsCompleted.available ? data.outcomeFunnel.projectsCompleted.value : "--"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Certificates Issued</span>
                <span className="font-medium">{data.outcomeFunnel.certificatesIssued.available ? data.outcomeFunnel.certificatesIssued.value : "--"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Global Funding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Requested Amount</span>
                <span className="font-medium font-mono text-slate-700">
                  {data.fundingRequested.available ? `₹${data.fundingRequested.value?.toLocaleString()}` : "--"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Approved Amount</span>
                <span className="font-medium font-mono text-blue-600">
                  {data.fundingApproved.available ? `₹${data.fundingApproved.value?.toLocaleString()}` : "--"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Disbursed Amount</span>
                <span className="font-medium font-mono text-green-600">
                  {data.fundingDisbursed.available ? `₹${data.fundingDisbursed.value?.toLocaleString()}` : "--"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
