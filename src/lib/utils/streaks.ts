/**
 * Calculates the new streak state based on explicit dates.
 * Dates should be provided in ISO string format or YYYY-MM-DD.
 */
export function calculateStreak(
  currentStreak: number,
  longestStreak: number,
  lastActivityAt: string | undefined,
  newActivityAt: string
): {
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string;
} {
  const newDate = new Date(newActivityAt);
  newDate.setHours(0, 0, 0, 0);

  if (!lastActivityAt) {
    // First activity ever
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, longestStreak),
      lastActivityAt: newDate.toISOString(),
    };
  }

  const lastDate = new Date(lastActivityAt);
  lastDate.setHours(0, 0, 0, 0);

  const diffTime = newDate.getTime() - lastDate.getTime();
  const diffDays = Math.round(Math.abs(diffTime) / (1000 * 60 * 60 * 24));

  let nextCurrentStreak = currentStreak;

  if (diffTime < 0) {
    // newActivityAt is BEFORE lastActivityAt (e.g. out of order event)
    return {
      currentStreak,
      longestStreak,
      lastActivityAt,
    };
  } else if (diffDays === 0) {
    // Activity on the same day -> streak continues but does not increment
    nextCurrentStreak = currentStreak === 0 ? 1 : currentStreak;
  } else if (diffDays === 1) {
    // Activity on the next day -> streak increments
    nextCurrentStreak = currentStreak + 1;
  } else {
    // Gap of more than 1 day -> streak resets
    nextCurrentStreak = 1;
  }

  const nextLongestStreak = Math.max(longestStreak, nextCurrentStreak);

  return {
    currentStreak: nextCurrentStreak,
    longestStreak: nextLongestStreak,
    lastActivityAt: newDate.toISOString(),
  };
}
