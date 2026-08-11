import { describe, it, expect } from 'vitest';
import { buildProjectContext } from '../lib/utils/project-context';
import { Project } from '../types/project';
import { Problem } from '../types/problem';
import { StudentProfile } from '../types/profile';

describe('Project Context Builder', () => {
  it('strips sensitive info and shapes data deterministically', () => {
    const project = { id: "p1", title: "Test Proj", status: "ALLOCATED" } as unknown as Project;
    const problem = { title: "Fix Earth", domain: "Green" } as unknown as Problem;
    const students = [{
      userId: "u1", 
      institutionId: "inst1", 
      skills: [], 
      privateEmail: "secret@x.com" 
    }] as unknown as StudentProfile[];
    
    const context = buildProjectContext(project, problem, null, students, [], [], [], 50, "ON_TRACK");
    
    // Check included info
    expect(context.project.title).toBe("Test Proj");
    expect(context.problem.domain).toBe("Green");
    
    // Check stripped info
    expect((context.team.members[0] as Record<string, unknown>).privateEmail).toBeUndefined();
    expect((context.team.members[0] as Record<string, unknown>).userId).toBe("u1");
  });
});
