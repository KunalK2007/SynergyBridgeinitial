"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { GamificationProfile, UserAchievement } from "@/types/gamification";
import { getLevelProgress } from "@/lib/utils/gamification";
import { ACHIEVEMENTS } from "@/lib/constants/gamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Trophy, Star, Zap, Target } from "lucide-react";
import Link from "next/link";

export default function GamificationDashboard() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      try {
        const pDoc = await getDoc(doc(db, "gamificationProfiles", currentUser.uid));
        if (pDoc.exists()) {
          setProfile(pDoc.data() as GamificationProfile);
        }

        const aSnap = await getDocs(collection(db, "users", currentUser.uid, "achievements"));
        setAchievements(aSnap.docs.map(d => d.data() as UserAchievement));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  if (loading) return <div className="p-8 text-[#5B5F73]">Loading your progress...</div>;

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-[#1C1C1E] mb-2">My SynergyBridge Journey</h1>
        <Card>
          <CardContent className="p-8 text-center text-[#5B5F73]">
            You haven&apos;t earned any XP yet. Start by completing your profile, submitting applications, or completing tasks!
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = getLevelProgress(profile.xp);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#1C1C1E] mb-2">My SynergyBridge Journey</h1>
          <p className="text-[#5B5F73]">Track your learning progress, skills, and achievements.</p>
        </div>
        <Link href="/explore/leaderboard" className="px-4 py-2 bg-[#EFEDE8] border border-[#5B5F73]/30 text-[#9C7A4C] rounded-md font-medium hover:bg-[#E8E6E1] transition-colors">
          View Leaderboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-[#1E2135] border-[#9C7A4C]/20">
          <CardContent className="p-8 flex flex-col items-center justify-center h-full text-center">
            <div className="w-32 h-32 rounded-full border-4 border-[#9C7A4C]/30 flex items-center justify-center bg-[#262B45] mb-6 relative">
              <span className="text-5xl font-black text-white">{profile.level}</span>
              <div className="absolute -bottom-3 bg-[#9C7A4C] text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-[#1E2135]">
                LEVEL
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">{currentUser?.displayName}</h2>
            <p className="text-[#9C7A4C] font-medium mb-8">{profile.xp} Total XP</p>

            <div className="w-full max-w-md space-y-2">
              <div className="flex justify-between text-xs font-semibold text-[#F6F5F2]/60">
                <span>{progress.xpForCurrentLevel} XP</span>
                <span>Next: {progress.xpForNextLevel} XP</span>
              </div>
              <div className="h-3 w-full bg-[#262B45] rounded-full overflow-hidden border border-[#2E3350]">
                <div
                  className="h-full bg-[#9C7A4C] rounded-full relative overflow-hidden"
                  style={{ width: `${progress.progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ transform: "translateX(-100%)" }}></div>
                </div>
              </div>
              <p className="text-xs text-[#F6F5F2]/40 text-right mt-1">{progress.xpForNextLevel - profile.xp} XP to next level</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#5B5F73] uppercase tracking-wider">Current Streak</p>
                <p className="text-2xl font-bold text-[#1C1C1E]">{profile.currentStreak} Days</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#5B5F73] uppercase tracking-wider">Tasks Done</p>
                <p className="text-2xl font-bold text-[#1C1C1E]">{profile.totalTasksCompleted}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#9C7A4C]/10 flex items-center justify-center text-[#9C7A4C]">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#5B5F73] uppercase tracking-wider">Achievements</p>
                <p className="text-2xl font-bold text-[#1C1C1E]">{achievements.filter(a => a.completed).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-xl font-bold text-[#1C1C1E]">Achievements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {ACHIEVEMENTS.map(ach => {
            const unlocked = achievements.find(a => a.achievementId === ach.id && a.completed);

            return (
              <Card key={ach.id} className={`border ${unlocked ? 'border-[#9C7A4C]/30' : 'border-[#5B5F73]/20 opacity-60'}`}>
                <CardContent className="p-5 flex flex-col items-center text-center relative h-full">
                  {unlocked && (
                    <div className="absolute top-2 right-2 text-[#9C7A4C]">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                  )}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${unlocked ? 'bg-[#9C7A4C]/10 text-[#9C7A4C]' : 'bg-[#5B5F73]/10 text-[#5B5F73]'}`}>
                    <Trophy className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-[#1C1C1E] text-sm mb-1">{ach.name}</h4>
                  <p className="text-xs text-[#5B5F73] leading-tight flex-1">{ach.description}</p>
                  <div className="mt-3 text-[10px] font-bold text-[#9C7A4C] bg-[#9C7A4C]/10 px-2 py-0.5 rounded-full">
                    +{ach.xpReward} XP
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
