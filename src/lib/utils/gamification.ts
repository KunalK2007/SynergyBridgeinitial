// MVP Leveling formula
// Level 1: 0 XP
// Level 2: 100 XP
// Level 3: 250 XP
// Level 4: 450 XP
// Level 5: 700 XP
// Level 6: 1000 XP
// Above 6, it increases by Level^2 * 50

const BASE_LEVELS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 450,
  5: 700,
  6: 1000,
};

/**
 * Returns the XP required to reach a specific level.
 */
export function getXpForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level <= 6) return BASE_LEVELS[level];
  
  // For level > 6, deterministic increasing curve
  return 1000 + ((level - 6) * (level - 6) * 50) + ((level - 6) * 200);
}

/**
 * Calculates the user's current level based on total XP.
 */
export function calculateLevelFromXp(xp: number): number {
  if (xp < 0) xp = 0;
  
  let level = 1;
  while (getXpForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
}

/**
 * Returns the XP required for the next level.
 */
export function getXpForNextLevel(level: number): number {
  return getXpForLevel(level + 1);
}

/**
 * Returns the progress towards the next level.
 */
export function getLevelProgress(xp: number): {
  currentLevel: number;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
} {
  if (xp < 0) xp = 0;
  
  const currentLevel = calculateLevelFromXp(xp);
  const xpForCurrentLevel = getXpForLevel(currentLevel);
  const xpForNextLevel = getXpForNextLevel(currentLevel);
  
  const xpIntoCurrentLevel = xp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  
  let progressPercent = 0;
  if (xpNeededForNextLevel > 0) {
    progressPercent = Math.floor((xpIntoCurrentLevel / xpNeededForNextLevel) * 100);
  }
  
  // Clamp between 0 and 100
  progressPercent = Math.max(0, Math.min(100, progressPercent));

  return {
    currentLevel,
    currentXp: xp,
    xpForCurrentLevel,
    xpForNextLevel,
    progressPercent,
  };
}
