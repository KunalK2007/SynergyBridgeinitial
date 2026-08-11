export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  institutionId?: string;
  xp: number;
  level: number;
  rank: number;
  achievementCount: number;
}
