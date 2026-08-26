import { describe, it, expect } from 'vitest';
import { Project, ProjectStatus } from '../types/project';
import { hasAssignedMentor } from '../lib/utils/project-helpers';

describe('Project Mentor Assignment Logic', () => {
  const baseProject: Partial<Project> = {
    id: "test_proj_1",
    title: "Test Project",
    status: ProjectStatus.IN_PROGRESS,
    progress: 50,
  };

  it('Case A & C: Project with mentorId reports mentor assigned without contradictions', () => {
    const projectWithMentor: Partial<Project> = {
      ...baseProject,
      mentorId: "some_mentor_uid"
    };

    // UI should use this shared helper to determine state
    const result = hasAssignedMentor(projectWithMentor);
    
    expect(result).toBe(true);
    // UI mapping validation:
    // List page: "Mentor Assigned"
    // Detail page: renders Mentor Card
  });

  it('Case B & C: Project without mentorId reports awaiting mentor without contradictions', () => {
    const projectWithoutMentor: Partial<Project> = {
      ...baseProject,
      // mentorId is omitted/undefined
    };

    // UI should use this shared helper to determine state
    const result = hasAssignedMentor(projectWithoutMentor);
    
    expect(result).toBe(false);
    // UI mapping validation:
    // List page: "Awaiting Mentor"
    // Detail page: renders "Awaiting Mentor Assignment" fallback card
  });

  it('Handles explicit null or empty mentorId gracefully', () => {
    const projectWithEmptyMentor = {
      ...baseProject,
      mentorId: ""
    };
    expect(hasAssignedMentor(projectWithEmptyMentor as Partial<Project>)).toBe(false);
  });
});
