import { describe, it, expect } from 'vitest';
import { ApplicationStatus, Application } from '../types/application';
import { Project, ProjectStatus } from '../types/project';

describe('Application Lifecycle Logic', () => {

  it('allows withdrawal only in eligible states', () => {
    const canWithdraw = (status: ApplicationStatus) => 
      [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, ApplicationStatus.SHORTLISTED].includes(status);
    
    expect(canWithdraw(ApplicationStatus.SUBMITTED)).toBe(true);
    expect(canWithdraw(ApplicationStatus.UNDER_REVIEW)).toBe(true);
    expect(canWithdraw(ApplicationStatus.ACCEPTED)).toBe(false);
    expect(canWithdraw(ApplicationStatus.REJECTED)).toBe(false);
  });

  it('rejects creating multiple projects for the same accepted application (idempotency simulation)', () => {
    // In our UI, the Accept button disappears after ACCEPTED.
    // At a functional level, accepting an application creates a project.
    let createdProjects = 0;
    let currentAppStatus = ApplicationStatus.SUBMITTED;

    const acceptApplication = () => {
      if (currentAppStatus === ApplicationStatus.ACCEPTED) {
        throw new Error("Application already accepted");
      }
      currentAppStatus = ApplicationStatus.ACCEPTED;
      createdProjects++;
    };

    acceptApplication();
    expect(createdProjects).toBe(1);
    expect(currentAppStatus).toBe(ApplicationStatus.ACCEPTED);

    expect(() => acceptApplication()).toThrow("Application already accepted");
    expect(createdProjects).toBe(1); // Idempotent check
  });
});
