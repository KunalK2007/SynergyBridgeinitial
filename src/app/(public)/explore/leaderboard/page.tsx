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
        // Fetch profiles where showOnLeaderboard == true
        const q = query(
          collection(db, "gamificationProfiles"),
          where("showOnLeaderboard", "==", true)
        );
        
        const snap = await getDocs(q);
        const profiles = snap.docs.map(d => d.data() as GamificationProfile);
        
        // We need to fetch display names for these profiles
        // For MVP, we fetch individually or we could have replicated displayName into gamificationProfiles
        // Let's fetch users concurrently
        const entryPromises = profiles.map(async (p) => {
          const uDoc = await getDoc(doc(db, "users", p.userId));
          const displayName = uDoc.exists() ? uDoc.data().displayName : "Anonymous Student";
          
          return {
            userId: p.userId,
            displayName,
            xp: p.xp,
            level: p.level,
            rank: 0, // Assigned later
            achievementCount: p.totalAchievements,
          } as LeaderboardEntry;
        });

        const resolvedEntries = await Promise.all(entryPromises);

        // Deterministic Sort: XP DESC -> LEVEL DESC -> ACHIEVEMENT COUNT DESC -> USER ID ASC
        resolvedEntries.sort((a, b) => {
          if (b.xp !== a.xp) return b.xp - a.xp;
          if (b.level !== a.level) return b.level - a.level;
          if (b.achievementCount !== a.achievementCount) return b.achievementCount - a.achievementCount;
          return a.userId.localeCompare(b.userId);
        });

        // Assign ranks
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

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-4">SynergyBridge Leaderboard</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Discover the top innovators driving impact through skill-building, teamwork, and problem-solving.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading leaderboard...</div>
        ) : (
          <div className="space-y-4">
            {entries.length === 0 ? (
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-12 text-center text-slate-400">
                  No participants on the leaderboard yet. Check your privacy settings to be included!
                </CardContent>
              </Card>
            ) : (
              entries.map((entry) => (
                <Card 
                  key={entry.userId} 
                  className={`bg-slate-900 border-slate-800 transition-transform hover:scale-[1.01] ${
                    entry.rank <= 3 ? "border-indigo-500/30" : ""
                  }`}
                >
                  <CardContent className="p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
                    {/* Rank */}
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center font-black text-2xl">
                      {entry.rank === 1 && <Trophy className="w-10 h-10 text-yellow-500" />}
                      {entry.rank === 2 && <Medal className="w-9 h-9 text-slate-300" />}
                      {entry.rank === 3 && <Medal className="w-8 h-8 text-amber-600" />}
                      {entry.rank > 3 && <span className="text-slate-500">#{entry.rank}</span>}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {entry.displayName}
                        {entry.rank === 1 && <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Top Innovator</span>}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-indigo-400" /> 
                          {entry.achievementCount} Achievements
                        </span>
                      </div>
                    </div>

                    {/* Level & XP */}
                    <div className="text-right">
                      <div className="text-2xl font-black text-indigo-400">{entry.xp} <span className="text-sm font-medium text-slate-500">XP</span></div>
                      <div className="text-sm font-bold text-white bg-slate-800 px-3 py-1 rounded-full inline-block mt-1">
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
