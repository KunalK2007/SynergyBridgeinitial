"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { RoleDashboard, DashboardFeedItem, RoleDashboardStats } from "@/components/layout/RoleDashboard";
import { RecommendedProblems } from "@/features/matching/components/RecommendedProblems";
import { StudentActiveProjects } from "@/features/projects/components/StudentActiveProjects";
import { StudentLearningPath } from "@/features/projects/components/StudentLearningPath";
import { GamificationProgressWidget } from "@/features/gamification/components/GamificationProgressWidget";
import { StudentAnalyticsWidget } from "@/features/analytics/components/StudentAnalyticsWidget";
import { Project, ProjectStatus } from "@/types/project";
import { Application } from "@/types/application";
import { Certificate } from "@/types/certificate";
import { FundingGrant } from "@/types/funding";
import { GamificationProfile } from "@/types/gamification";

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<RoleDashboardStats>({ loading: true });
  const [feedItems, setFeedItems] = useState<DashboardFeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!currentUser) {
        setStats({ loading: false });
        setFeedLoading(false);
        return;
      }

      try {
        const studentId = currentUser.uid;

        // 1. Fetch Student Projects
        const projectsSnap = await getDocs(
          query(collection(db, "projects"), where("studentIds", "array-contains", studentId))
        );
        const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
        const activeProjects = projects.filter(
          p => p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.ALLOCATED
        );

        // 2. Fetch Student Applications / Matches
        const appsSnap = await getDocs(
          query(collection(db, "applications"), where("applicantId", "==", studentId))
        );
        const apps = appsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Application));

        // 3. Fetch Gamification Profile for Impact Score
        let impactDisplay: string | number = "--";
        let gamificationData: GamificationProfile | null = null;
        try {
          const gamificationDoc = await getDoc(doc(db, "gamificationProfiles", studentId));
          if (gamificationDoc.exists()) {
            gamificationData = gamificationDoc.data() as GamificationProfile;
            if (gamificationData.xp !== undefined && gamificationData.xp > 0) {
              impactDisplay = `${gamificationData.xp.toLocaleString()} XP`;
            } else if (gamificationData.level !== undefined && gamificationData.level > 1) {
              impactDisplay = `Level ${gamificationData.level}`;
            }
          }
        } catch (err) {
          console.error("Failed to load student gamification for impact score:", err);
        }

        // 4. Fetch Certificates
        let certs: Certificate[] = [];
        try {
          const certsSnap = await getDocs(
            query(collection(db, "certificates"), where("studentId", "==", studentId))
          );
          certs = certsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Certificate));
        } catch (err) {
          console.error("Failed to load certificates for feed:", err);
        }

        // 5. Fetch Funding Grants requested by student or for student projects
        let grants: FundingGrant[] = [];
        try {
          const grantsSnap = await getDocs(
            query(collection(db, "fundingGrants"), where("requestedBy", "==", studentId))
          );
          grants = grantsSnap.docs.map(d => ({ id: d.id, ...d.data() } as FundingGrant));
        } catch (err) {
          console.error("Failed to load funding grants for feed:", err);
        }

        // 6. Assemble Activity Feed
        const items: DashboardFeedItem[] = [];

        // Project events & subcollection activity
        for (const proj of projects) {
          items.push({
            id: `proj-${proj.id}`,
            title: `Joined Project: ${proj.title}`,
            description: `Status: ${proj.status.replace(/_/g, " ")} • ${proj.progress || 0}% progress`,
            timestamp: proj.startDate || proj.createdAt,
            type: "PROJECT",
            link: `/dashboard/projects/${proj.id}`
          });

          try {
            const actSnap = await getDocs(collection(db, "projects", proj.id, "activity"));
            actSnap.forEach(actDoc => {
              const actData = actDoc.data();
              items.push({
                id: `act-${actDoc.id}`,
                title: actData.action ? `Activity: ${actData.action.replace(/_/g, " ")}` : `Activity on ${proj.title}`,
                description: `${actData.actorName || "Team"} performed ${actData.entityType || "update"} on ${proj.title}`,
                timestamp: actData.createdAt || Date.now(),
                type: "TASK",
                link: `/dashboard/projects/${proj.id}`
              });
            });
          } catch {
            // Activity subcollection may not exist on all projects, safe to ignore
          }
        }

        // Application events
        for (const app of apps) {
          items.push({
            id: `app-${app.id}`,
            title: `Application: ${app.status.replace(/_/g, " ")}`,
            description: app.proposal ? app.proposal.slice(0, 80) + "..." : "Application submitted for problem match.",
            timestamp: app.updatedAt || app.createdAt,
            type: "APPLICATION",
            link: `/explore/problems/${app.problemId}`
          });
        }

        // Certificate events
        for (const cert of certs) {
          items.push({
            id: `cert-${cert.id}`,
            title: `Certificate Issued: ${cert.projectTitle || "Project Complete"}`,
            description: `Verification ID: ${cert.verificationId || "DEMO-CERT"}`,
            timestamp: cert.issuedAt || cert.createdAt,
            type: "CERTIFICATE",
            link: `/verify/${cert.verificationId}`
          });
        }

        // Funding events
        for (const grant of grants) {
          items.push({
            id: `grant-${grant.id}`,
            title: `Grant ${grant.status}: ₹${grant.approvedAmount || grant.requestedAmount || 0}`,
            description: `${grant.tier || "SEED"} Tier grant disbursed for innovation.`,
            timestamp: grant.updatedAt || grant.createdAt,
            type: "FUNDING",
            link: `/dashboard/projects/${grant.projectId}`
          });
        }

        // Gamification streak event
        if (gamificationData && gamificationData.currentStreak > 0) {
          items.push({
            id: `streak-${studentId}`,
            title: `${gamificationData.currentStreak}-Day Activity Streak`,
            description: `Total XP: ${gamificationData.xp} • Level ${gamificationData.level}`,
            timestamp: gamificationData.updatedAt || Date.now(),
            type: "GAMIFICATION",
            link: "/dashboard/student/gamification"
          });
        }

        // Sort items by timestamp descending
        items.sort((a, b) => {
          const tsA = typeof a.timestamp === "number" ? a.timestamp : new Date(a.timestamp).getTime();
          const tsB = typeof b.timestamp === "number" ? b.timestamp : new Date(b.timestamp).getTime();
          return (tsB || 0) - (tsA || 0);
        });

        setStats({
          activeProjects: activeProjects.length,
          matches: apps.length,
          impactScore: impactDisplay,
          loading: false
        });
        setFeedItems(items.slice(0, 10));
      } catch (error) {
        console.error("Failed to load student dashboard metrics:", error);
        setStats({
          activeProjects: 0,
          matches: 0,
          impactScore: "--",
          loading: false
        });
      } finally {
        setFeedLoading(false);
      }
    }

    loadDashboardData();
  }, [currentUser]);

  return (
    <div className="space-y-8">
      <RoleDashboard
        roleName="Student Innovator"
        description="Find problems, build teams, and create impact."
        stats={stats}
        feedItems={feedItems}
        feedLoading={feedLoading}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <StudentActiveProjects />
        <GamificationProgressWidget />
      </div>
      <StudentAnalyticsWidget />
      <StudentLearningPath />
      <RecommendedProblems />
    </div>
  );
}
