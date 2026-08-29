"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { RoleDashboard, DashboardFeedItem, RoleDashboardStats } from "@/components/layout/RoleDashboard";
import { Project, ProjectStatus } from "@/types/project";
import { Problem } from "@/types/problem";
import { Application } from "@/types/application";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { GraduationCap, ArrowRight, Lightbulb, Users } from "lucide-react";

export default function FacultyDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<RoleDashboardStats>({ loading: true });
  const [feedItems, setFeedItems] = useState<DashboardFeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [counts, setCounts] = useState({
    projectsCount: 0,
    problemsCount: 0,
    applicationsCount: 0
  });

  useEffect(() => {
    async function loadFacultyData() {
      if (!currentUser) {
        setStats({ loading: false });
        setFeedLoading(false);
        return;
      }

      let projects: Project[] = [];
      let problems: Problem[] = [];
      let apps: Application[] = [];

      // 1. Projects
      try {
        const pSnap = await getDocs(collection(db, "projects"));
        projects = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
      } catch (err) {
        console.warn("Faculty: projects query:", err);
      }

      // 2. Problems
      try {
        const probSnap = await getDocs(collection(db, "problems"));
        problems = probSnap.docs.map(d => ({ id: d.id, ...d.data() } as Problem));
      } catch (err) {
        console.warn("Faculty: problems query:", err);
      }

      // 3. Applications
      try {
        const appSnap = await getDocs(collection(db, "applications"));
        apps = appSnap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
      } catch (err) {
        console.warn("Faculty: applications query:", err);
      }

      const activeProjects = projects.filter(
        p => p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.ALLOCATED
      );
      const completedProjects = projects.filter(
        p => p.status === ProjectStatus.COMPLETED
      );

      setCounts({
        projectsCount: projects.length,
        problemsCount: problems.length,
        applicationsCount: apps.length
      });

      let impactScoreStr = "--";
      if (projects.length > 0) {
        const rate = Math.round((completedProjects.length / projects.length) * 100);
        impactScoreStr = `${rate}% Completion`;
      } else if (problems.length > 0) {
        impactScoreStr = `${problems.length} Tracked`;
      }

      setStats({
        activeProjects: activeProjects.length || projects.length,
        matches: apps.length,
        impactScore: impactScoreStr,
        loading: false
      });

      // Feed items
      const items: DashboardFeedItem[] = [];
      for (const p of projects) {
        items.push({
          id: `fac-proj-${p.id}`,
          title: `Project: ${p.title}`,
          description: `${p.progress || 0}% progress • Status: ${p.status.replace(/_/g, " ")}`,
          timestamp: p.updatedAt || p.createdAt,
          type: "PROJECT",
          link: `/dashboard/projects/${p.id}`
        });
      }

      for (const prob of problems) {
        items.push({
          id: `fac-prob-${prob.id}`,
          title: `Problem: ${prob.title}`,
          description: `Domain: ${prob.domain} • Status: ${prob.status}`,
          timestamp: prob.createdAt,
          type: "APPLICATION",
          link: `/explore/problems/${prob.id}`
        });
      }

      items.sort((a, b) => {
        const tA = typeof a.timestamp === "number" ? a.timestamp : new Date(a.timestamp).getTime();
        const tB = typeof b.timestamp === "number" ? b.timestamp : new Date(b.timestamp).getTime();
        return (tB || 0) - (tA || 0);
      });

      setFeedItems(items.slice(0, 10));
      setFeedLoading(false);
    }

    loadFacultyData();
  }, [currentUser]);

  return (
    <div className="space-y-8">
      <RoleDashboard
        roleName="Faculty Coordinator"
        description="Oversee student project progress, validate problem submissions, and align industry challenges with curriculum."
        stats={stats}
        feedItems={feedItems}
        feedLoading={feedLoading}
      />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[#1C1C1E]">Institutional Operations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-[#9C7A4C]/20 shadow-sm hover:border-[#9C7A4C]/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-[#1C1C1E]">Problem Creation</CardTitle>
              <Lightbulb className="h-5 w-5 text-[#9C7A4C]" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold text-[#1C1C1E]">{counts.problemsCount}</div>
              <p className="text-xs text-[#5B5F73]">Post and publish curriculum-aligned challenges.</p>
              <Link
                href="/dashboard/problems/create"
                className="inline-flex items-center text-xs font-semibold text-[#9C7A4C] hover:text-[#7A6039]"
              >
                Create Problem <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-[#9C7A4C]/20 shadow-sm hover:border-[#9C7A4C]/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-[#1C1C1E]">Student Teams</CardTitle>
              <Users className="h-5 w-5 text-[#9C7A4C]" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold text-[#1C1C1E]">{counts.applicationsCount}</div>
              <p className="text-xs text-[#5B5F73]">Applications submitted by student innovators.</p>
              <Link
                href="/dashboard/applications"
                className="inline-flex items-center text-xs font-semibold text-[#9C7A4C] hover:text-[#7A6039]"
              >
                Review Applications <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-[#9C7A4C]/20 shadow-sm hover:border-[#9C7A4C]/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-[#1C1C1E]">Active Projects</CardTitle>
              <GraduationCap className="h-5 w-5 text-[#9C7A4C]" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold text-[#1C1C1E]">{counts.projectsCount}</div>
              <p className="text-xs text-[#5B5F73]">Monitor milestone delivery and student learning.</p>
              <Link
                href="/dashboard/projects"
                className="inline-flex items-center text-xs font-semibold text-[#9C7A4C] hover:text-[#7A6039]"
              >
                View Projects <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
