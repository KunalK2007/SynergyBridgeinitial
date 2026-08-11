import { describe, it, expect } from 'vitest';
import { calculateProjectHealth, ProjectHealthStatus } from '../lib/utils/project-health';

describe('Project Health Calculation', () => {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  it('is ON_TRACK for recent activity with no deadline issues', () => {
    const now = Date.now();
    const lastActivity = now - (3 * MS_PER_DAY);
    const result = calculateProjectHealth(lastActivity, now, null, 50);
    
    expect(result.status).toBe(ProjectHealthStatus.ON_TRACK);
    expect(result.daysSinceActivity).toBe(3);
  });

  it('is AT_RISK when dormant for 8 days', () => {
    const now = Date.now();
    const lastActivity = now - (8 * MS_PER_DAY);
    const result = calculateProjectHealth(lastActivity, now, null, 50);
    
    expect(result.status).toBe(ProjectHealthStatus.AT_RISK);
  });

  it('is STALLED when dormant for 15 days', () => {
    const now = Date.now();
    const lastActivity = now - (15 * MS_PER_DAY);
    const result = calculateProjectHealth(lastActivity, now, null, 50);
    
    expect(result.status).toBe(ProjectHealthStatus.STALLED);
  });

  it('is AT_RISK if deadline is < 7 days and progress is < 70%', () => {
    const now = Date.now();
    const lastActivity = now - (1 * MS_PER_DAY);
    const deadline = now + (5 * MS_PER_DAY);
    const result = calculateProjectHealth(lastActivity, now, deadline, 60);
    
    expect(result.status).toBe(ProjectHealthStatus.AT_RISK);
    expect(result.reason).toContain("Approaching deadline");
  });

  it('is ON_TRACK if deadline is < 7 days but progress is >= 70%', () => {
    const now = Date.now();
    const lastActivity = now - (1 * MS_PER_DAY);
    const deadline = now + (5 * MS_PER_DAY);
    const result = calculateProjectHealth(lastActivity, now, deadline, 80);
    
    expect(result.status).toBe(ProjectHealthStatus.ON_TRACK);
  });
});
