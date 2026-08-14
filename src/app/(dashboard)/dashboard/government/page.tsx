"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { RoleDashboard, DashboardFeedItem, RoleDashboardStats } from "@/components/layout/RoleDashboard";
import { Project, ProjectStatus } from "@/types/project";
import { Problem } from "@/types/problem";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { Landmark, Lightbulb, ArrowRight, Layers } from "lucide-react";

export default function GovernmentDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<RoleDashboardStats>({ loading: true });
  const [feedItems, setFeedItems] = useState<DashboardFeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [counts, setCounts] = useState({
    problemsCount: 0,
    projectsCount: 0,
    civicImpactCount: 0
  });

  useEffect(() => {
    async function loadGovernmentData() {
      if (!currentUser) {
        setStats({ loading: false });
        setFeedLoading(false);
        return;
      }

      let projects: Project[] = [];
      let problems: Problem[] = [];

      try {
        const pSnap = await getDocs(collection(db, "projects"));
        projects = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
      } catch (err) {
        console.warn("Government: projects query:", err);
      }

      try {
        const probSnap = await getDocs(collection(db, "problems"));
        problems = probSnap.docs.map(d => ({ id: d.id, ...d.data() } as Problem));
      } catch (err) {
        console.warn("Government: problems query:", err);
      }

      const activeProjects = projects.filter(
        p => p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.ALLOCATED
      );
      const completedProjects = projects.filter(
        p => p.status === ProjectStatus.COMPLETED
      );

      setCounts({
        problemsCount: problems.length,
        projectsCount: projects.length,
        civicImpactCount: completedProjects.length
      });

      setStats({
        activeProjects: activeProjects.length || projects.length,
        matches: problems.length,
        impactScore: `${completedProjects.length} Regional Solutions`,
        loading: false
      });

      const items: DashboardFeedItem[] = [];
      for (const p of projects) {
        items.push({
          id: `gov-proj-${p.id}`,
          title: `Civic Project: ${p.title}`,
          description: `${p.progress || 0}% completed • Domain: ${p.domain || p.category || "Regional Impact"}`,
          timestamp: p.updatedAt || p.createdAt,
          type: "PROJECT",
          link: `/dashboard/projects/${p.id}`
        });
      }

      for (const prob of problems) {
        items.push({
          id: `gov-prob-${prob.id}`,
          title: `Civic Challenge: ${prob.title}`,
          description: `Regional problem posted. Scope: ${prob.geographicScope || "State"}`,
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

    loadGovernmentData();
  }, [currentUser]);

  return (
    <div className="space-y-8">
      <RoleDashboard
        roleName="Government Official"
        description="Post public sector challenges, track regional innovation metrics, and drive measurable civic impact."
        stats={stats}
        feedItems={feedItems}
        feedLoading={feedLoading}
      />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[#1C1C1E]">Civic Innovation Hub</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-[#9C7A4C]/20 shadow-sm hover:border-[#9C7A4C]/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-[#1C1C1E]">Post Civic Challenge</CardTitle>
              <Landmark className="h-5 w-5 text-[#9C7A4C]" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold text-[#1C1C1E]">{counts.problemsCount}</div>
              <p className="text-xs text-[#5B5F73]">Publish public-sector challenge statements.</p>
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
              <CardTitle className="text-sm font-semibold text-[#1C1C1E]">Regional Projects</CardTitle>
              <Layers className="h-5 w-5 text-[#9C7A4C]" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold text-[#1C1C1E]">{counts.projectsCount}</div>
              <p className="text-xs text-[#5B5F73]">Active technology deployments across regions.</p>
              <Link
                href="/dashboard/projects"
                className="inline-flex items-center text-xs font-semibold text-[#9C7A4C] hover:text-[#7A6039]"
              >
                View Projects <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-[#9C7A4C]/20 shadow-sm hover:border-[#9C7A4C]/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-[#1C1C1E]">Verified Solutions</CardTitle>
              <Lightbulb className="h-5 w-5 text-[#9C7A4C]" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold text-[#1C1C1E]">{counts.civicImpactCount}</div>
              <p className="text-xs text-[#5B5F73]">Completed solutions ready for public deployment.</p>
              <Link
                href="/showcase"
                className="inline-flex items-center text-xs font-semibold text-[#9C7A4C] hover:text-[#7A6039]"
              >
                Explore Showcase <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
