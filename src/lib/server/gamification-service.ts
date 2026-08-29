import { adminDb } from "@/lib/firebase/admin";
import { Transaction, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { 
  GamificationEventType, 
  GamificationProfile, 
  GamificationEvent, 
  UserAchievement 
} from "@/types/gamification";
import { XP_REWARDS, ACHIEVEMENTS } from "@/lib/constants/gamification";
import { calculateLevelFromXp } from "@/lib/utils/gamification";
import { calculateStreak } from "@/lib/utils/streaks";
import { evaluateAchievements } from "@/lib/utils/achievements";
import { v4 as uuidv4 } from "uuid";

interface ProcessEventResult {
  success: boolean;
  xpAwarded: number;
  newLevel?: number;
  newAchievements: string[];
  message: string;
}

export async function processGamificationEvent(
  userId: string,
  eventType: GamificationEventType,
  sourceId: string,
  metadata?: Record<string, unknown>
): Promise<ProcessEventResult> {
  const idempotencyKey = `${userId}_${eventType}_${sourceId}`;
  
  try {
    return await adminDb.runTransaction(async (t: Transaction) => {
      // 1. Check idempotency
      const eventRef = adminDb.collection("gamificationEvents").doc(idempotencyKey);
      const eventDoc = await t.get(eventRef);
      if (eventDoc.exists) {
        return {
          success: true,
          xpAwarded: 0,
          newAchievements: [],
          message: "Event already processed",
        };
      }

      // 2. Fetch or initialize profile
      const profileRef = adminDb.collection("gamificationProfiles").doc(userId);
      const profileDoc = await t.get(profileRef);
      
      let profile: GamificationProfile;
      const now = new Date().toISOString();

      if (profileDoc.exists) {
        profile = profileDoc.data() as GamificationProfile;
      } else {
        profile = {
          userId,
          xp: 0,
          level: 1,
          lifetimeXp: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalProjectsCompleted: 0,
          totalTasksCompleted: 0,
          totalMilestonesCompleted: 0,
          totalProblemsSolved: 0,
          totalAchievements: 0,
          showOnLeaderboard: true,
          createdAt: now,
          updatedAt: now,
        };
      }

      // 3. Determine XP reward and update counters
      let xpAwarded = 0;
      switch (eventType) {
        case GamificationEventType.PROFILE_COMPLETED:
          xpAwarded = XP_REWARDS.PROFILE_COMPLETED;
          break;
        case GamificationEventType.SKILLS_ADDED:
          xpAwarded = XP_REWARDS.FIRST_SKILLS_ADDED;
          break;
        case GamificationEventType.APPLICATION_SUBMITTED:
          xpAwarded = XP_REWARDS.APPLICATION_SUBMITTED;
          break;
        case GamificationEventType.APPLICATION_ACCEPTED:
          xpAwarded = XP_REWARDS.APPLICATION_ACCEPTED;
          break;
        case GamificationEventType.TEAM_CREATED:
          xpAwarded = XP_REWARDS.TEAM_CREATED;
          break;
        case GamificationEventType.TEAM_JOINED:
          xpAwarded = XP_REWARDS.TEAM_JOINED;
          break;
        case GamificationEventType.TASK_COMPLETED:
          xpAwarded = XP_REWARDS.TASK_COMPLETED;
          profile.totalTasksCompleted++;
          break;
        case GamificationEventType.MILESTONE_COMPLETED:
          xpAwarded = XP_REWARDS.MILESTONE_COMPLETED;
          profile.totalMilestonesCompleted++;
          break;
        case GamificationEventType.PROJECT_COMPLETED:
          xpAwarded = XP_REWARDS.PROJECT_COMPLETED;
          profile.totalProjectsCompleted++;
          break;
        case GamificationEventType.PROBLEM_ACCEPTED:
          xpAwarded = XP_REWARDS.PROBLEM_SOLVED;
          profile.totalProblemsSolved++;
          break;
        case GamificationEventType.MENTOR_FEEDBACK_RECEIVED:
          xpAwarded = XP_REWARDS.MENTOR_FEEDBACK_RECEIVED;
          break;
        case GamificationEventType.LEARNING_PATH_ITEM_COMPLETED:
          xpAwarded = XP_REWARDS.LEARNING_PATH_ITEM_COMPLETED;
          break;
        default:
          throw new Error("Unknown gamification event type");
      }

      // 4. Update Profile XP and Level
      const oldLevel = profile.level;
      profile.xp += xpAwarded;
      profile.lifetimeXp += xpAwarded;
      profile.level = calculateLevelFromXp(profile.xp);
      profile.updatedAt = now;

      // 5. Update Streaks
      const streakUpdate = calculateStreak(
        profile.currentStreak, 
        profile.longestStreak, 
        profile.lastActivityAt, 
        now
      );
      profile.currentStreak = streakUpdate.currentStreak;
      profile.longestStreak = streakUpdate.longestStreak;
      profile.lastActivityAt = streakUpdate.lastActivityAt;

      // 6. Record Event
      const newEvent: GamificationEvent = {
        id: idempotencyKey,
        userId,
        type: eventType,
        sourceId,
        xpAwarded,
        metadata,
        createdAt: now,
      };
      t.set(eventRef, newEvent);

      // 7. Evaluate Achievements
      const achievementsRef = adminDb.collection("users").doc(userId).collection("achievements");
      const existingAchievementsSnapshot = await t.get(achievementsRef);
      const existingAchievements = existingAchievementsSnapshot.docs.map(
        (d: QueryDocumentSnapshot) => d.data() as UserAchievement
      );

      const { newlyUnlocked } = evaluateAchievements(profile, existingAchievements);
      
      const newAchievementNames: string[] = [];
      for (const achievement of newlyUnlocked) {
        const uaId = `${userId}_${achievement.id}`;
        const newUa: UserAchievement = {
          id: uaId,
          userId,
          achievementId: achievement.id,
          unlockedAt: now,
          progress: achievement.criteria.target,
          completed: true,
        };
        t.set(achievementsRef.doc(achievement.id), newUa);
        
        // Award XP for achievement
        profile.xp += achievement.xpReward;
        profile.lifetimeXp += achievement.xpReward;
        profile.totalAchievements++;
        
        newAchievementNames.push(achievement.name);
        
        // Create an event for the achievement reward
        const achievementEventId = `${userId}_ACHIEVEMENT_UNLOCKED_${achievement.id}`;
        const achievementEvent: GamificationEvent = {
          id: achievementEventId,
          userId,
          type: GamificationEventType.PROFILE_COMPLETED, // Hack: Should be ACHIEVEMENT_UNLOCKED but not in enum
          sourceId: achievement.id,
          sourceType: "ACHIEVEMENT",
          xpAwarded: achievement.xpReward,
          metadata: { achievementName: achievement.name },
          createdAt: now,
        };
        t.set(adminDb.collection("gamificationEvents").doc(achievementEventId), achievementEvent);
      }
      
      // Recalculate level just in case achievement XP pushed them over
      const finalLevel = calculateLevelFromXp(profile.xp);
      profile.level = finalLevel;

      // 8. Commit Profile
      t.set(profileRef, profile, { merge: true });

      // 9. Process Notifications (Outside transaction ideally, but we'll do it securely here)
      if (newAchievementNames.length > 0 || finalLevel > oldLevel) {
        const notificationsRef = adminDb.collection("users").doc(userId).collection("notifications");
        
        if (finalLevel > oldLevel) {
          t.set(notificationsRef.doc(), {
            userId,
            type: "SYSTEM",
            title: "Level Up! 🎉",
            message: `Congratulations! You reached Level ${finalLevel}.`,
            read: false,
            createdAt: Date.now()
          });
        }
        
        for (const achievementName of newAchievementNames) {
          t.set(notificationsRef.doc(), {
            userId,
            type: "SYSTEM",
            title: "Achievement Unlocked! 🏆",
            message: `You unlocked the ${achievementName} achievement!`,
            read: false,
            createdAt: Date.now()
          });
        }
      }

      return {
        success: true,
        xpAwarded,
        newLevel: finalLevel > oldLevel ? finalLevel : undefined,
        newAchievements: newAchievementNames,
        message: "Event processed successfully",
      };
    });
  } catch (error) {
    console.error("Error processing gamification event:", error);
    return {
      success: false,
      xpAwarded: 0,
      newAchievements: [],
      message: "Internal server error during gamification processing",
    };
  }
}
