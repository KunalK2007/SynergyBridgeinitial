import { describe, it, expect } from "vitest";
import { getXpForLevel, calculateLevelFromXp, getLevelProgress } from "../lib/utils/gamification";

describe("Gamification Engine", () => {
  describe("getXpForLevel", () => {
    it("returns correct base XP for levels 1-6", () => {
      expect(getXpForLevel(1)).toBe(0);
      expect(getXpForLevel(2)).toBe(100);
      expect(getXpForLevel(3)).toBe(250);
      expect(getXpForLevel(6)).toBe(1000);
    });

    it("returns correct calculated XP for level 7", () => {
      // 1000 + (1 * 1 * 50) + (1 * 200) = 1250
      expect(getXpForLevel(7)).toBe(1250);
    });
  });

  describe("calculateLevelFromXp", () => {
    it("returns level 1 for 0-99 XP", () => {
      expect(calculateLevelFromXp(0)).toBe(1);
      expect(calculateLevelFromXp(99)).toBe(1);
    });

    it("returns level 2 for 100-249 XP", () => {
      expect(calculateLevelFromXp(100)).toBe(2);
      expect(calculateLevelFromXp(249)).toBe(2);
    });

    it("handles negative XP gracefully", () => {
      expect(calculateLevelFromXp(-50)).toBe(1);
    });
  });

  describe("getLevelProgress", () => {
    it("calculates progress correctly", () => {
      const progress = getLevelProgress(150); // Level 2
      expect(progress.currentLevel).toBe(2);
      expect(progress.xpForCurrentLevel).toBe(100);
      expect(progress.xpForNextLevel).toBe(250);
      expect(progress.progressPercent).toBe(Math.floor((50 / 150) * 100)); // 33%
    });

    it("clamps progress percent to 100", () => {
      // Technically should never be >= 100 without leveling up, but just in case
      const progress = getLevelProgress(250);
      expect(progress.progressPercent).toBe(0); // Because it leveled up to 3
    });
  });
});
