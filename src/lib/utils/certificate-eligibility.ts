import { Project } from "@/types/project";
import { StudentProfile } from "@/types/profile";
import { Task } from "@/types/task";
import { Milestone } from "@/types/milestone";
import { calculateStudentProfileCompleteness } from "./profile-helpers";
import { ORIGINALITY_PASS_THRESHOLD } from "../constants/funding";

export interface CertificateEligibilityResult {
  eligible: boolean;
  reasons: string[];
  checks: {
    projectCompleted: boolean;
    studentProfileComplete: boolean;
    tasksComplete: boolean;
    milestonesComplete: boolean;
    originalityPassed: boolean;
  };
  snapshot: {
    taskCompletionPercentage: number;
    completedMilestones: boolean;
    originalityScore: number;
    eligibilityCheckedAt: string;
  };
}

export function canIssueCertificate(
  project: Project,
  student: StudentProfile,
  tasks: Task[],
  milestones: Milestone[],
  originalityScore: number | null
): CertificateEligibilityResult {
  const reasons: string[] = [];

  const checks = {
    projectCompleted: false,
    studentProfileComplete: false,
    tasksComplete: false,
    milestonesComplete: false,
    originalityPassed: false,
  };

  // 1. Project Completed
  // NOTE: Depending on Phase 3C implementation, project status might be "COMPLETED"
  if (project.status === "COMPLETED") {
    checks.projectCompleted = true;
  } else {
    reasons.push(`Project is not marked as COMPLETED. Current status: ${project.status}`);
  }

  // 2. Student Profile Complete
  if (calculateStudentProfileCompleteness(student) === 100) {
    checks.studentProfileComplete = true;
  } else {
    reasons.push("Student profile is incomplete.");
  }

  // 3. Tasks Complete (80%)
  let taskCompletionPercentage = 0;
  if (tasks.length === 0) {
    reasons.push("Project contains no tasks.");
  } else {
    const completedTasks = tasks.filter((t) => t.status === "DONE").length;
    taskCompletionPercentage = (completedTasks / tasks.length) * 100;
    
    if (taskCompletionPercentage >= 80) {
      checks.tasksComplete = true;
    } else {
      reasons.push(`Task completion is below 80% (Current: ${taskCompletionPercentage.toFixed(1)}%).`);
    }
  }

  // 4. Milestones Complete
  let milestonesComplete = true;
  if (milestones.length > 0) {
    const incompleteMandatory = milestones.find(m => (m as unknown as Record<string, unknown>).mandatory && m.status !== "COMPLETED");
    if (incompleteMandatory) {
      milestonesComplete = false;
      reasons.push("Mandatory project milestones are incomplete.");
    }
  }
  checks.milestonesComplete = milestonesComplete;

  // 5. Originality Check
  if (originalityScore === null || originalityScore === undefined) {
    reasons.push("Originality assessment is missing.");
  } else if (originalityScore >= ORIGINALITY_PASS_THRESHOLD) {
    checks.originalityPassed = true;
  } else {
    reasons.push(`Originality score ${originalityScore} is below threshold ${ORIGINALITY_PASS_THRESHOLD}.`);
  }

  const eligible = Object.values(checks).every((c) => c === true);

  return {
    eligible,
    reasons,
    checks,
    snapshot: {
      taskCompletionPercentage,
      completedMilestones: milestonesComplete,
      originalityScore: originalityScore || 0,
      eligibilityCheckedAt: new Date().toISOString(),
    }
  };
}
