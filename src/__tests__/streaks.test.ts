import { describe, it, expect } from "vitest";
import { calculateStreak } from "../lib/utils/streaks";

describe("Streak Engine", () => {
  it("initializes a streak for the first activity", () => {
    const result = calculateStreak(0, 0, undefined, "2024-01-01T12:00:00Z");
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it("continues streak on the same day without incrementing", () => {
    const result = calculateStreak(1, 1, "2024-01-01T08:00:00Z", "2024-01-01T18:00:00Z");
    expect(result.currentStreak).toBe(1);
  });

  it("increments streak on the next day", () => {
    const result = calculateStreak(1, 1, "2024-01-01T08:00:00Z", "2024-01-02T12:00:00Z");
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it("resets streak if a day is skipped", () => {
    const result = calculateStreak(5, 5, "2024-01-01T08:00:00Z", "2024-01-03T12:00:00Z");
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(5);
  });

  it("does not modify streak if new activity is before last activity", () => {
    const result = calculateStreak(5, 5, "2024-01-02T08:00:00Z", "2024-01-01T12:00:00Z");
    expect(result.currentStreak).toBe(5);
    expect(result.lastActivityAt).toBe("2024-01-02T08:00:00Z");
  });
});
