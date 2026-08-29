"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/purity */
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { RoleDashboard, DashboardFeedItem, RoleDashboardStats } from "@/components/layout/RoleDashboard";
import { Project, ProjectStatus } from "@/types/project";
import { Application } from "@/types/application";
import { Problem } from "@/types/problem";
import { Certificate } from "@/types/certificate";
import { FundingGrant } from "@/types/funding";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { getOperationMode } from "@/app/actions";
import { 
  ShieldCheck, 
  BarChart3, 
  Layers, 
  ArrowRight
} from "lucide-react";
import { SurgeTelemetryWidget } from "@/components/telemetry/SurgeTelemetryWidget";

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<RoleDashboardStats>({ loading: true });
  const [feedItems, setFeedItems] = useState<DashboardFeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalProblems: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalApps: 0,
    totalCerts: 0,
    totalFunding: 0
  });
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    getOperationMode().then(mode => setIsRecoveryMode(mode === "RECOVERY"));
    async function loadAdminData() {
      if (!currentUser) {
        setStats({ loading: false });
        setFeedLoading(false);
        return;
      }

      let projects: Project[] = [];
      let apps: Application[] = [];
      let problems: Problem[] = [];
      let certs: Certificate[] = [];
      let grants: FundingGrant[] = [];

      // 1. Projects
      try {
        const pSnap = await getDocs(collection(db, "projects"));
        projects = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
      } catch (err) {
        console.warn("Admin: could not load projects directly:", err);
      }

      // 2. Applications
      try {
        const aSnap = await getDocs(collection(db, "applications"));
        apps = aSnap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
      } catch (err) {
        console.warn("Admin: could not load applications directly:", err);
      }

      // 3. Problems
      try {
        const probSnap = await getDocs(collection(db, "problems"));
        problems = probSnap.docs.map(d => ({ id: d.id, ...d.data() } as Problem));
      } catch (err) {
        console.warn("Admin: could not load problems directly:", err);
      }

      // 4. Certificates
      try {
        const cSnap = await getDocs(collection(db, "certificates"));
        certs = cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Certificate));
      } catch (err) {
        console.warn("Admin: could not load certificates directly:", err);
      }

      // 5. Funding Grants
      try {
        const gSnap = await getDocs(collection(db, "fundingGrants"));
        grants = gSnap.docs.map(d => ({ id: d.id, ...d.data() } as FundingGrant));
      } catch (err) {
        console.warn("Admin: could not load fundingGrants directly:", err);
      }

      const activeProjects = projects.filter(
        p => p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.ALLOCATED
      ).length;
      const completedProjects = projects.filter(
        p => p.status === ProjectStatus.COMPLETED
      ).length;

      let totalFundingAmt = 0;
      grants.forEach(g => {
        totalFundingAmt += (g.approvedAmount || g.requestedAmount || 0);
      });

      setOverview({
        totalProblems: problems.length,
        totalProjects: projects.length,
        activeProjects,
        completedProjects,
        totalApps: apps.length,
        totalCerts: certs.length,
        totalFunding: totalFundingAmt
      });

      // Calculate Impact Score string
      let impactScoreStr = "--";
      if (projects.length > 0) {
        const completionRate = Math.round((completedProjects / projects.length) * 100);
        impactScoreStr = `${completionRate}% Completion`;
      } else if (problems.length > 0) {
        impactScoreStr = `${problems.length} Challenges`;
      }

      setStats({
        loading: false,
        activeProjects: activeProjects || projects.length,
        matches: apps.length,
        impactScore: impactScoreStr
      });

      // Assemble platform feed
      const items: DashboardFeedItem[] = [];

      // Add Project items
      for (const proj of projects) {
        items.push({
          id: `admin-proj-${proj.id}`,
          title: `Project: ${proj.title}`,
          description: `Status: ${proj.status.replace(/_/g, " ")} • ${proj.progress || 0}% progress • Domain: ${proj.domain || proj.category || "AI & Engineering"}`,
          timestamp: proj.startDate || proj.createdAt,
          type: "PROJECT",
          link: `/dashboard/projects/${proj.id}`
        });
      }

      // Add Problem items
      for (const prob of problems) {
        items.push({
          id: `admin-prob-${prob.id}`,
          title: `Problem Published: ${prob.title}`,
          description: `Domain: ${prob.domain} • Organization: ${prob.organizationName || "Industry Partner"} • Status: ${prob.status}`,
          timestamp: prob.createdAt,
          type: "APPLICATION",
          link: `/explore/problems/${prob.id}`
        });
      }

      // Add Certificate items
      for (const cert of certs) {
        items.push({
          id: `admin-cert-${cert.id}`,
          title: `Certificate Issued: ${cert.projectTitle || "Project Completion"}`,
          description: `Student ID: ${cert.studentId} • Verification ID: ${cert.verificationId}`,
          timestamp: cert.issuedAt || cert.createdAt,
          type: "CERTIFICATE",
          link: `/verify/${cert.verificationId}`
        });
      }

      // Add Funding items
      for (const grant of grants) {
        items.push({
          id: `admin-grant-${grant.id}`,
          title: `Innovation Grant ${grant.status}: ₹${grant.approvedAmount || grant.requestedAmount || 0}`,
          description: `Project: ${grant.projectId} • Tranches: ${grant.milestones?.length || 0}`,
          timestamp: grant.createdAt || grant.reviewedAt || Date.now(),
          type: "FUNDING",
          link: `/dashboard/projects/${grant.projectId}`
        });
      }

      // Sort chronological descending
      items.sort((a, b) => {
        const timeA = typeof a.timestamp === "number" ? a.timestamp : new Date(a.timestamp).getTime();
        const timeB = typeof b.timestamp === "number" ? b.timestamp : new Date(b.timestamp).getTime();
        return timeB - timeA;
      });

      setFeedItems(items.slice(0, 10));
      setFeedLoading(false);
    }

    loadAdminData();
  }, [currentUser]);

  return (
    <div className="space-y-8">
      <RoleDashboard
        roleName="Platform Admin"
        description="Monitor ecosystem metrics, manage problem moderation, and oversee active innovation projects."
        stats={stats}
        feedItems={feedItems}
        feedLoading={feedLoading}
      />

      {/* Live Surge & Concurrency Telemetry (Challenge 9c) */}
      <SurgeTelemetryWidget />

      {/* Admin Quick Action Hub */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[#1C1C1E]">Platform Operations</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-[#9C7A4C]/20 shadow-sm md:col-span-1 bg-[#1C1C1E] text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#9C7A4C]">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Application:</span>
                <span className="text-emerald-400 font-bold">Operational</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Authentication:</span>
                <span className="text-emerald-400 font-bold">Available</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Funding:</span>
                <span className={isRecoveryMode ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>{isRecoveryMode ? "PAUSED" : "ACTIVE"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Verification:</span>
                <span className={isRecoveryMode ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>{isRecoveryMode ? "PAUSED" : "ACTIVE"}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-800 mt-2">
                <span className="text-gray-400">Mode:</span>
                <span className={isRecoveryMode ? "text-red-500 font-black" : "text-emerald-400 font-bold"}>{isRecoveryMode ? "RECOVERY" : "NORMAL"}</span>
              </div>
              <div className="text-[10px] text-gray-500 pt-2 mt-2 border-t border-gray-800">
                Mode set via SYNERGYBRIDGE_OPERATION_MODE. Server restart required to toggle.
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#9C7A4C]/20 shadow-sm hover:border-[#9C7A4C]/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-[#1C1C1E]">Problem Moderation</CardTitle>
              <ShieldCheck className="h-5 w-5 text-[#9C7A4C]" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold text-[#1C1C1E]">{overview.totalProblems}</div>
              <p className="text-xs text-[#5B5F73]">Total challenge problems published and pending review.</p>
              <Link
                href="/dashboard/admin/problems"
                className="inline-flex items-center text-xs font-semibold text-[#9C7A4C] hover:text-[#7A6039]"
              >
                Review Problems <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-[#9C7A4C]/20 shadow-sm hover:border-[#9C7A4C]/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-[#1C1C1E]">Platform Analytics</CardTitle>
              <BarChart3 className="h-5 w-5 text-[#9C7A4C]" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold text-[#1C1C1E]">{overview.totalApps}</div>
              <p className="text-xs text-[#5B5F73]">Total applications, student matches, and pipeline funnels.</p>
              <Link
                href="/dashboard/admin/analytics"
                className="inline-flex items-center text-xs font-semibold text-[#9C7A4C] hover:text-[#7A6039]"
              >
                View Analytics <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-[#9C7A4C]/20 shadow-sm hover:border-[#9C7A4C]/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-[#1C1C1E]">Projects Workspace</CardTitle>
              <Layers className="h-5 w-5 text-[#9C7A4C]" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold text-[#1C1C1E]">{overview.totalProjects}</div>
              <p className="text-xs text-[#5B5F73]">{overview.activeProjects} active, {overview.completedProjects} completed projects.</p>
              <Link
                href="/dashboard/projects"
                className="inline-flex items-center text-xs font-semibold text-[#9C7A4C] hover:text-[#7A6039]"
              >
                Explore Projects <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
