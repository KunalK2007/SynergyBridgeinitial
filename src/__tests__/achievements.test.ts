import { describe, it, expect } from "vitest";
import { evaluateAchievements } from "../lib/utils/achievements";
import { GamificationProfile, UserAchievement } from "../types/gamification";

describe("Achievements Engine", () => {
  it("evaluates achievements correctly based on criteria", () => {
    const mockProfile: GamificationProfile = {
      userId: "u1",
      xp: 100,
      level: 1,
      lifetimeXp: 100,
      currentStreak: 8,
      longestStreak: 8,
      totalProjectsCompleted: 6,
      totalTasksCompleted: 0,
      totalMilestonesCompleted: 11,
      totalProblemsSolved: 0,
      totalAchievements: 0,
      showOnLeaderboard: true,
      createdAt: "date",
      updatedAt: "date",
    };

    const existingAchievements: UserAchievement[] = [];

    const { newlyUnlocked } = evaluateAchievements(mockProfile, existingAchievements);
    
    const unlockedIds = newlyUnlocked.map(a => a.id);
    expect(unlockedIds).toContain("project-starter");
    expect(unlockedIds).toContain("project-master");
    expect(unlockedIds).toContain("consistent-learner");
    expect(unlockedIds).toContain("synergybridge-contributor");
  });

  it("does not unlock already unlocked achievements", () => {
    const mockProfile: GamificationProfile = {
      userId: "u1",
      xp: 100,
      level: 1,
      lifetimeXp: 100,
      currentStreak: 8,
      longestStreak: 8,
      totalProjectsCompleted: 6,
      totalTasksCompleted: 0,
      totalMilestonesCompleted: 11,
      totalProblemsSolved: 0,
      totalAchievements: 0,
      showOnLeaderboard: true,
      createdAt: "date",
      updatedAt: "date",
    };

    const existingAchievements: UserAchievement[] = [
      { id: "a1", userId: "u1", achievementId: "project-starter", unlockedAt: "date", progress: 1, completed: true }
    ];

    const { newlyUnlocked } = evaluateAchievements(mockProfile, existingAchievements);
    const unlockedIds = newlyUnlocked.map(a => a.id);
    
    expect(unlockedIds).not.toContain("project-starter");
    expect(unlockedIds).toContain("project-master");
  });
});
