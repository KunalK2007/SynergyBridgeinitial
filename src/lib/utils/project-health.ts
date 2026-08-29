import { ProjectStatus } from "@/types/project";

export enum ProjectHealthStatus {
  ON_TRACK = "ON_TRACK",
  AT_RISK = "AT_RISK",
  STALLED = "STALLED"
}

export interface ProjectHealthResult {
  status: ProjectHealthStatus;
  daysSinceActivity: number;
  daysUntilDeadline: number | null;
  reason: string;
}

export function calculateProjectHealth(
  lastActivityAt: number,
  currentDate: number,
  targetCompletionDate: number | undefined | null,
  progress: number,
  projectStatus?: ProjectStatus | string | null
): ProjectHealthResult {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const daysSinceActivity = Math.floor(Math.max(0, currentDate - lastActivityAt) / MS_PER_DAY);
  
  let daysUntilDeadline: number | null = null;
  if (targetCompletionDate) {
    daysUntilDeadline = Math.ceil((targetCompletionDate - currentDate) / MS_PER_DAY);
  }

  // Completed projects (or projects with 100% progress marked as completed) have reached their terminal state.
  // Inactivity is expected after project completion and should not trigger a STALLED / AT_RISK health warning.
  const isCompleted = projectStatus === ProjectStatus.COMPLETED || 
                      projectStatus === "COMPLETED" || 
                      (progress >= 100 && (projectStatus === undefined || projectStatus === null || projectStatus === ProjectStatus.COMPLETED || projectStatus === "COMPLETED"));

  if (isCompleted) {
    return {
      status: ProjectHealthStatus.ON_TRACK,
      daysSinceActivity,
      daysUntilDeadline,
      reason: "Project is completed."
    };
  }

  // STALLED Rules for active/in-progress projects
  if (daysSinceActivity >= 15) {
    return {
      status: ProjectHealthStatus.STALLED,
      daysSinceActivity,
      daysUntilDeadline,
      reason: "No activity for 15+ days."
    };
  }

  // AT_RISK Rules for active/in-progress projects
  if (daysSinceActivity >= 8 && daysSinceActivity <= 14) {
    return {
      status: ProjectHealthStatus.AT_RISK,
      daysSinceActivity,
      daysUntilDeadline,
      reason: "No activity for 8-14 days."
    };
  }

  if (daysUntilDeadline !== null && daysUntilDeadline <= 7 && progress < 70) {
    return {
      status: ProjectHealthStatus.AT_RISK,
      daysSinceActivity,
      daysUntilDeadline,
      reason: "Approaching deadline with low progress."
    };
  }

  return {
    status: ProjectHealthStatus.ON_TRACK,
    daysSinceActivity,
    daysUntilDeadline,
    reason: "Project is on track."
  };
}
