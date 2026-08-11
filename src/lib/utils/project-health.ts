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
  progress: number
): ProjectHealthResult {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const daysSinceActivity = Math.floor(Math.max(0, currentDate - lastActivityAt) / MS_PER_DAY);
  
  let daysUntilDeadline: number | null = null;
  if (targetCompletionDate) {
    daysUntilDeadline = Math.ceil((targetCompletionDate - currentDate) / MS_PER_DAY);
  }

  // STALLED Rules
  if (daysSinceActivity >= 15) {
    return {
      status: ProjectHealthStatus.STALLED,
      daysSinceActivity,
      daysUntilDeadline,
      reason: "No activity for 15+ days."
    };
  }

  // AT_RISK Rules
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
