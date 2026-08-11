import { Task, TaskStatus } from "@/types/task";
import { Milestone } from "@/types/milestone";

export function calculateProjectProgress(tasks: Task[], milestones: Milestone[]): number {
  if (tasks.length === 0 && milestones.length === 0) {
    return 0;
  }

  let taskProgress = 0;
  if (tasks.length > 0) {
    const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
    taskProgress = (completedTasks / tasks.length) * 100;
  }

  let milestoneProgress = 0;
  if (milestones.length > 0) {
    const totalMilestoneCompletion = milestones.reduce((sum, m) => sum + (m.completionPercentage || 0), 0);
    milestoneProgress = totalMilestoneCompletion / milestones.length;
  }

  if (tasks.length > 0 && milestones.length > 0) {
    return Math.round((taskProgress * 0.5) + (milestoneProgress * 0.5));
  } else if (tasks.length > 0) {
    return Math.round(taskProgress);
  } else {
    return Math.round(milestoneProgress);
  }
}
