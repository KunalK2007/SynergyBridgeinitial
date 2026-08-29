import { Project } from "@/types/project";
import { Problem } from "@/types/problem";
import { Task } from "@/types/task";
import { Milestone } from "@/types/milestone";
import { MentorFeedback } from "@/types/mentor-feedback";
import { StudentProfile } from "@/types/profile";
import { Team } from "@/types/team";

export function buildProjectContext(
  project: Project,
  problem: Problem,
  team: Team | null,
  students: StudentProfile[],
  tasks: Task[],
  milestones: Milestone[],
  feedback: MentorFeedback[],
  progress: number,
  healthStatus: string
) {
  // Strip sensitive PII or private flags from student profiles
  const sanitizedStudents = students.map(s => ({
    userId: s.userId,
    institutionId: s.institutionId,
    department: s.department,
    skills: s.skills,
    completedProblems: (s as unknown as Record<string, unknown>).completedProblems
  }));

  return {
    project: {
      id: project.id,
      title: project.title,
      status: project.status,
      progress,
      healthStatus,
      startDate: project.startDate,
      targetCompletionDate: project.targetCompletionDate
    },
    problem: {
      title: problem.title,
      description: (problem as unknown as Record<string, unknown>).description,
      domain: problem.domain,
      requiredSkills: (problem as unknown as Record<string, unknown>).requiredSkills,
      preferredSkills: (problem as unknown as Record<string, unknown>).preferredSkills,
    },
    team: team ? {
      id: team.id,
      name: team.name,
      members: sanitizedStudents
    } : {
      members: sanitizedStudents
    },
    metrics: {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === "DONE").length,
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter(m => m.status === "COMPLETED").length,
    },
    openTasks: tasks.filter(t => t.status !== "DONE").map(t => ({ title: t.title, priority: t.priority })),
    upcomingMilestones: milestones.filter(m => m.status !== "COMPLETED").map(m => ({ title: m.title, targetDate: m.targetDate })),
    mentorFeedback: feedback.map(f => ({
      targetType: f.targetType,
      feedback: f.feedback,
      rating: f.rating,
      date: f.createdAt
    }))
  };
}
