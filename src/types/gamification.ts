export interface GamificationProfile {
  userId: string;
  xp: number;
  level: number;
  lifetimeXp: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt?: string;
  totalProjectsCompleted: number;
  totalTasksCompleted: number;
  totalMilestonesCompleted: number;
  totalProblemsSolved: number;
  totalAchievements: number;
  showOnLeaderboard: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum AchievementCategory {
  PROJECT = "PROJECT",
  PROBLEM_SOLVING = "PROBLEM_SOLVING",
  LEARNING = "LEARNING",
  COLLABORATION = "COLLABORATION",
  TEAMWORK = "TEAMWORK",
  MENTORSHIP = "MENTORSHIP",
  CONSISTENCY = "CONSISTENCY",
  PROFILE = "PROFILE",
  SPECIAL = "SPECIAL",
}

export enum AchievementRarity {
  COMMON = "COMMON",
  UNCOMMON = "UNCOMMON",
  RARE = "RARE",
  EPIC = "EPIC",
  LEGENDARY = "LEGENDARY",
}

export interface AchievementCriteria {
  type: string;
  target: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  criteria: AchievementCriteria;
  active: boolean;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  progress: number;
  completed: boolean;
}

export enum GamificationEventType {
  PROJECT_COMPLETED = "PROJECT_COMPLETED",
  TASK_COMPLETED = "TASK_COMPLETED",
  MILESTONE_COMPLETED = "MILESTONE_COMPLETED",
  PROBLEM_ACCEPTED = "PROBLEM_ACCEPTED",
  APPLICATION_SUBMITTED = "APPLICATION_SUBMITTED",
  APPLICATION_ACCEPTED = "APPLICATION_ACCEPTED",
  TEAM_CREATED = "TEAM_CREATED",
  TEAM_JOINED = "TEAM_JOINED",
  MENTOR_FEEDBACK_RECEIVED = "MENTOR_FEEDBACK_RECEIVED",
  LEARNING_PATH_ITEM_COMPLETED = "LEARNING_PATH_ITEM_COMPLETED",
  PROFILE_COMPLETED = "PROFILE_COMPLETED",
  SKILLS_ADDED = "SKILLS_ADDED",
  CERTIFICATE_ISSUED = "CERTIFICATE_ISSUED",
  ORIGINALITY_PASSED = "ORIGINALITY_PASSED",
  FUNDING_MILESTONE_REACHED = "FUNDING_MILESTONE_REACHED",
}

export const XP_REWARDS: Record<GamificationEventType, number> = {
  [GamificationEventType.PROJECT_COMPLETED]: 50,
  [GamificationEventType.TASK_COMPLETED]: 10,
  [GamificationEventType.MILESTONE_COMPLETED]: 15,
  [GamificationEventType.PROBLEM_ACCEPTED]: 25,
  [GamificationEventType.APPLICATION_SUBMITTED]: 5,
  [GamificationEventType.APPLICATION_ACCEPTED]: 20,
  [GamificationEventType.TEAM_CREATED]: 10,
  [GamificationEventType.TEAM_JOINED]: 5,
  [GamificationEventType.MENTOR_FEEDBACK_RECEIVED]: 15,
  [GamificationEventType.LEARNING_PATH_ITEM_COMPLETED]: 20,
  [GamificationEventType.PROFILE_COMPLETED]: 30,
  [GamificationEventType.SKILLS_ADDED]: 5,
  [GamificationEventType.CERTIFICATE_ISSUED]: 100,
  [GamificationEventType.ORIGINALITY_PASSED]: 50,
  [GamificationEventType.FUNDING_MILESTONE_REACHED]: 75,
};



export interface GamificationEvent {
  id: string;
  userId: string;
  type: GamificationEventType;
  sourceId?: string;
  sourceType?: string;
  xpAwarded: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
