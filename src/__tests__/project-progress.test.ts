import { describe, it, expect } from 'vitest';
import { calculateProjectProgress } from '../lib/utils/project-progress';
import { Task, TaskStatus, TaskPriority } from '../types/task';
import { Milestone, MilestoneStatus } from '../types/milestone';

describe('Project Progress Calculation', () => {
  const mockTask = (status: TaskStatus): Task => ({
    id: 't1', projectId: 'p1', title: 'Task', status, priority: TaskPriority.MEDIUM, createdBy: 'u1', createdAt: 0, updatedAt: 0
  });

  const mockMilestone = (completionPercentage: number): Milestone => ({
    id: 'm1', projectId: 'p1', title: 'Milestone', description: '', targetDate: 0, status: MilestoneStatus.IN_PROGRESS, completionPercentage, createdBy: 'u1', createdAt: 0, updatedAt: 0
  });

  it('returns 0 when no tasks or milestones exist', () => {
    expect(calculateProjectProgress([], [])).toBe(0);
  });

  it('returns 100 based on tasks only', () => {
    expect(calculateProjectProgress([mockTask(TaskStatus.DONE), mockTask(TaskStatus.DONE)], [])).toBe(100);
  });

  it('returns 50 based on tasks only', () => {
    expect(calculateProjectProgress([mockTask(TaskStatus.DONE), mockTask(TaskStatus.TODO)], [])).toBe(50);
  });

  it('returns 100 based on milestones only', () => {
    expect(calculateProjectProgress([], [mockMilestone(100), mockMilestone(100)])).toBe(100);
  });

  it('combines tasks and milestones (50/50 weighting)', () => {
    // Tasks: 1/2 DONE -> 50% task progress (contributes 25%)
    const tasks = [mockTask(TaskStatus.DONE), mockTask(TaskStatus.TODO)];
    
    // Milestones: 50% and 100% -> 75% milestone progress (contributes 37.5%)
    const milestones = [mockMilestone(50), mockMilestone(100)];
    
    // Total should be Math.round(25 + 37.5) = 63
    expect(calculateProjectProgress(tasks, milestones)).toBe(63);
  });
});
