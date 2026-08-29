"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { GamificationProfile } from "@/types/gamification";
import { LeaderboardEntry } from "@/types/leaderboard";
import { Card, CardContent } from "@/components/ui/Card";
import { Trophy, Medal, Star } from "lucide-react";
import { getLevelProgress } from "@/lib/utils/gamification";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, "gamificationProfiles"),
          where("showOnLeaderboard", "==", true)
        );

        const snap = await getDocs(q);
        const profiles = snap.docs.map(d => d.data() as GamificationProfile);

        const entryPromises = profiles.map(async (p) => {
          const uDoc = await getDoc(doc(db, "users", p.userId));
          const displayName = uDoc.exists() ? uDoc.data().displayName : "Anonymous Student";

          return {
            userId: p.userId,
            displayName,
            xp: p.xp,
            level: p.level,
            rank: 0,
            achievementCount: p.totalAchievements,
          } as LeaderboardEntry;
        });

        const resolvedEntries = await Promise.all(entryPromises);

        resolvedEntries.sort((a, b) => {
          if (b.xp !== a.xp) return b.xp - a.xp;
          if (b.level !== a.level) return b.level - a.level;
          if (b.achievementCount !== a.achievementCount) return b.achievementCount - a.achievementCount;
          return a.userId.localeCompare(b.userId);
        });

        resolvedEntries.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setEntries(resolvedEntries);
      } catch (err) {
        console.error("Failed to load leaderboard", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Suppress unused import warning
  void getLevelProgress;

  return (
    <div className="min-h-screen bg-[#F6F5F2] dark:bg-[#0B0D14] pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-[#1C1C1E] dark:text-[#F3F4F6] mb-4">SynergyBridge Leaderboard</h1>
          <p className="text-[#5B5F73] dark:text-[#9499AD] text-lg max-w-2xl mx-auto">
            Discover the top innovators driving impact through skill-building, teamwork, and problem-solving.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-[#5B5F73] dark:text-[#9499AD] py-12">Loading leaderboard...</div>
        ) : (
          <div className="space-y-4">
            {entries.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-[#5B5F73] dark:text-[#9499AD]">
                  No participants on the leaderboard yet. Check your privacy settings to be included!
                </CardContent>
              </Card>
            ) : (
              entries.map((entry) => (
                <Card
                  key={entry.userId}
                  className={`transition-transform hover:scale-[1.01] ${
                    entry.rank <= 3 ? "border-[#9C7A4C]/40" : ""
                  }`}
                >
                  <CardContent className="p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
                    {/* Rank */}
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center font-black text-2xl">
                      {entry.rank === 1 && <Trophy className="w-10 h-10 text-yellow-500" />}
                      {entry.rank === 2 && <Medal className="w-9 h-9 text-[#5B5F73] dark:text-[#9499AD]" />}
                      {entry.rank === 3 && <Medal className="w-8 h-8 text-amber-600 dark:text-amber-400" />}
                      {entry.rank > 3 && <span className="text-[#5B5F73] dark:text-[#9499AD]">#{entry.rank}</span>}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#1C1C1E] dark:text-[#F3F4F6] flex items-center gap-2">
                        {entry.displayName}
                        {entry.rank === 1 && <span className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Top Innovator</span>}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-[#5B5F73] dark:text-[#9499AD]">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#9C7A4C]" />
                          {entry.achievementCount} Achievements
                        </span>
                      </div>
                    </div>

                    {/* Level & XP */}
                    <div className="text-right">
                      <div className="text-2xl font-black text-[#9C7A4C]">{entry.xp} <span className="text-sm font-medium text-[#5B5F73] dark:text-[#9499AD]">XP</span></div>
                      <div className="text-sm font-bold text-[#1C1C1E] dark:text-[#F3F4F6] bg-[#5B5F73]/10 dark:bg-[#5B5F73]/20 px-3 py-1 rounded-full inline-block mt-1">
                        Level {entry.level}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
