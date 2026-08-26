import { Project } from "@/types/project";

/**
 * Determines whether a project has a mentor assigned.
 * This is the single authoritative source of truth for mentor assignment state.
 * 
 * @param project The project to check
 * @returns true if a mentor is assigned, false otherwise
 */
export const hasAssignedMentor = (project: Partial<Project>): boolean => {
  return Boolean(project.mentorId);
};
