"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { doc, getDoc, collection, query, getDocs } from "firebase/firestore";
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

  if (loading) return <div className="p-8 text-slate-400">Loading your progress...</div>;

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white mb-2">My SynergyBridge Journey</h1>
        <Card>
          <CardContent className="p-8 text-center text-slate-400">
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
          <h1 className="text-3xl font-bold text-white mb-2">My SynergyBridge Journey</h1>
          <p className="text-slate-400">Track your learning progress, skills, and achievements.</p>
        </div>
        <Link href="/explore/leaderboard" className="px-4 py-2 bg-slate-900 border border-slate-700 text-indigo-400 rounded-md font-medium hover:bg-slate-800 transition-colors">
          View Leaderboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950/20 border-indigo-500/20">
          <CardContent className="p-8 flex flex-col items-center justify-center h-full text-center">
            <div className="w-32 h-32 rounded-full border-4 border-indigo-500/30 flex items-center justify-center bg-slate-950 mb-6 relative">
              <span className="text-5xl font-black text-white">{profile.level}</span>
              <div className="absolute -bottom-3 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-slate-950">
                LEVEL
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">{currentUser?.displayName}</h2>
            <p className="text-indigo-400 font-medium mb-8">{profile.xp} Total XP</p>
            
            <div className="w-full max-w-md space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>{progress.xpForCurrentLevel} XP</span>
                <span>Next: {progress.xpForNextLevel} XP</span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-indigo-500 rounded-full relative overflow-hidden" 
                  style={{ width: `${progress.progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ transform: "translateX(-100%)" }}></div>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-right mt-1">{progress.xpForNextLevel - profile.xp} XP to next level</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-900/30 flex items-center justify-center text-amber-500">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Current Streak</p>
                <p className="text-2xl font-bold text-white">{profile.currentStreak} Days</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Tasks Done</p>
                <p className="text-2xl font-bold text-white">{profile.totalTasksCompleted}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-500">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Achievements</p>
                <p className="text-2xl font-bold text-white">{achievements.filter(a => a.completed).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-xl font-bold text-white">Achievements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {ACHIEVEMENTS.map(ach => {
            const unlocked = achievements.find(a => a.achievementId === ach.id && a.completed);
            
            return (
              <Card key={ach.id} className={`border ${unlocked ? 'bg-slate-900 border-indigo-500/30' : 'bg-slate-950 border-slate-800 opacity-60'}`}>
                <CardContent className="p-5 flex flex-col items-center text-center relative h-full">
                  {unlocked && (
                    <div className="absolute top-2 right-2 text-indigo-400">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                  )}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${unlocked ? 'bg-indigo-900/40 text-indigo-400' : 'bg-slate-900 text-slate-600'}`}>
                    <Trophy className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">{ach.name}</h4>
                  <p className="text-xs text-slate-400 leading-tight flex-1">{ach.description}</p>
                  <div className="mt-3 text-[10px] font-bold text-indigo-500 bg-indigo-950 px-2 py-0.5 rounded-full">
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
