import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Target, Users, Lightbulb, CheckCircle2, Award, BadgeDollarSign, ArrowUpRight, Clock, Flame } from "lucide-react";
import Link from "next/link";

export interface RoleDashboardStats {
  activeProjects?: number;
  matches?: number;
  impactScore?: string | number;
  loading?: boolean;
}

export interface DashboardFeedItem {
  id: string;
  title: string;
  description: string;
  timestamp: number | string;
  type?: "PROJECT" | "APPLICATION" | "MILESTONE" | "TASK" | "CERTIFICATE" | "FUNDING" | "GAMIFICATION";
  link?: string;
}

export interface RoleDashboardProps {
  roleName: string;
  description: string;
  stats?: RoleDashboardStats;
  feedItems?: DashboardFeedItem[];
  feedLoading?: boolean;
}

export function RoleDashboard({
  roleName,
  description,
  stats,
  feedItems,
  feedLoading = false,
}: RoleDashboardProps) {
  const formatTimestamp = (ts: number | string) => {
    try {
      const date = typeof ts === "number" ? new Date(ts) : new Date(String(ts));
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return "";
    }
  };

  const getFeedIcon = (type?: string) => {
    switch (type) {
      case "CERTIFICATE":
        return <Award className="w-5 h-5 text-amber-500" />;
      case "FUNDING":
        return <BadgeDollarSign className="w-5 h-5 text-emerald-600" />;
      case "MILESTONE":
      case "TASK":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "GAMIFICATION":
        return <Flame className="w-5 h-5 text-amber-600" />;
      case "APPLICATION":
        return <Target className="w-5 h-5 text-[#9C7A4C] dark:text-[#C4A880]" />;
      case "PROJECT":
      default:
        return <Lightbulb className="w-5 h-5 text-[#9C7A4C] dark:text-[#C4A880]" />;
    }
  };

  const hasFeed = feedItems && feedItems.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1C1C1E] dark:text-[#F3F4F6] mb-2">Welcome, {roleName}</h1>
        <p className="text-[#5B5F73] dark:text-[#9499AD]">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-[#9C7A4C]/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#5B5F73] dark:text-[#9499AD]">Active Projects</CardTitle>
            <Lightbulb className="h-4 w-4 text-[#9C7A4C] dark:text-[#C4A880]" />
          </CardHeader>
          <CardContent>
            {stats?.loading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">
                {stats?.activeProjects !== undefined ? stats.activeProjects : 0}
              </div>
            )}
            <p className="text-xs text-[#5B5F73] dark:text-[#9499AD]">
              {stats?.activeProjects && stats.activeProjects > 0
                ? `${stats.activeProjects} active collaboration${stats.activeProjects > 1 ? "s" : ""}`
                : "Projects will appear here"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#9C7A4C]/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#5B5F73] dark:text-[#9499AD]">Matches</CardTitle>
            <Users className="h-4 w-4 text-[#9C7A4C] dark:text-[#C4A880]" />
          </CardHeader>
          <CardContent>
            {stats?.loading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">
                {stats?.matches !== undefined ? stats.matches : 0}
              </div>
            )}
            <p className="text-xs text-[#5B5F73] dark:text-[#9499AD]">
              {stats?.matches && stats.matches > 0
                ? `${stats.matches} relevant match${stats.matches > 1 ? "es" : ""} / application${stats.matches > 1 ? "s" : ""}`
                : "No active matches yet"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#9C7A4C]/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#5B5F73] dark:text-[#9499AD]">Impact Score</CardTitle>
            <Target className="h-4 w-4 text-[#9C7A4C] dark:text-[#C4A880]" />
          </CardHeader>
          <CardContent>
            {stats?.loading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">
                {stats?.impactScore !== undefined && stats?.impactScore !== null && stats.impactScore !== ""
                  ? stats.impactScore
                  : "--"}
              </div>
            )}
            <p className="text-xs text-[#5B5F73] dark:text-[#9499AD]">
              {stats?.impactScore && stats.impactScore !== "--"
                ? "Authoritative impact & gamification XP"
                : "Complete projects to build impact"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-[#F3F4F6] mb-4">Your Feed</h2>
        {feedLoading ? (
          <Card className="p-6 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </Card>
        ) : hasFeed ? (
          <div className="space-y-3">
            {feedItems.map((item) => (
              <Card
                key={item.id}
                className="border-[#9C7A4C]/15 hover:border-[#9C7A4C]/35 transition-colors shadow-sm"
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-lg bg-[#F6F5F2] dark:bg-[#1A1E2E] border border-[#5B5F73]/15 dark:border-[#252A3D] flex items-center justify-center">
                      {getFeedIcon(item.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-[#1C1C1E] dark:text-[#F3F4F6]">{item.title}</h4>
                      <p className="text-xs text-[#5B5F73] dark:text-[#9499AD] mt-0.5">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {item.timestamp && (
                      <span className="text-xs text-[#5B5F73] dark:text-[#9499AD] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(item.timestamp)}
                      </span>
                    )}
                    {item.link && (
                      <Link
                        href={item.link}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#9C7A4C] dark:text-[#C4A880] hover:text-[#7A6039] dark:hover:text-[#9C7A4C] p-1.5 hover:bg-[#9C7A4C]/10 rounded-md transition-colors"
                      >
                        View <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={Target}
              title="No activity yet"
              description="Once you join a project, submit applications, or achieve milestones, your activity and updates will appear here."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
