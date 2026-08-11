import { RoleDashboard } from "@/components/layout/RoleDashboard";
import { RecommendedProblems } from "@/features/matching/components/RecommendedProblems";
import { StudentActiveProjects } from "@/features/projects/components/StudentActiveProjects";
import { StudentLearningPath } from "@/features/projects/components/StudentLearningPath";
import { GamificationProgressWidget } from "@/features/gamification/components/GamificationProgressWidget";
import { StudentAnalyticsWidget } from "@/features/analytics/components/StudentAnalyticsWidget";

export default function StudentDashboard() {
  return (
    <div className="space-y-8">
      <RoleDashboard roleName="Student Innovator" description="Find problems, build teams, and create impact." />
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
