import { GamificationProfile, Achievement, UserAchievement } from "@/types/gamification";
import { ACHIEVEMENTS } from "@/lib/constants/gamification";

/**
 * Evaluates which achievements a user is eligible for and their current progress.
 */
export function evaluateAchievements(
  profile: GamificationProfile,
  existingUserAchievements: UserAchievement[]
): {
  newlyUnlocked: Achievement[];
  updatedProgress: Partial<UserAchievement>[]; // Not strictly needed for MVP if we only track complete vs incomplete
} {
  const newlyUnlocked: Achievement[] = [];
  const existingUnlockedIds = new Set(
    existingUserAchievements.filter(a => a.completed).map(a => a.achievementId)
  );

  for (const achievement of ACHIEVEMENTS) {
    if (!achievement.active) continue;
    if (existingUnlockedIds.has(achievement.id)) continue;

    const { type, target } = achievement.criteria;
    let currentValue = 0;

    switch (type) {
      case "PROFILE_COMPLETED":
        // This is handled via event directly, but we can assume if this is checked, 
        // they either have it or we check an external flag. Let's assume GamificationProfile doesn't 
        // store `isProfileCompleted` directly. We rely on the event processor to grant it.
        break;
      case "SKILLS_COUNT":
        // We'll rely on GamificationProfile tracking totalSkills, or event.
        // For now, if we don't have it on profile, we wait for the SKILLS_ADDED event.
        break;
      case "APPLICATIONS_SUBMITTED":
        // Rely on event or profile tracking
        break;
      case "TEAMS_JOINED":
        break;
      case "PROJECTS_COMPLETED":
        currentValue = profile.totalProjectsCompleted;
        break;
      case "STREAK_DAYS":
        currentValue = profile.currentStreak;
        break;
      case "MILESTONES_COMPLETED":
        currentValue = profile.totalMilestonesCompleted;
        break;
    }

    if (currentValue >= target) {
      newlyUnlocked.push(achievement);
    }
  }

  return { newlyUnlocked, updatedProgress: [] };
}
