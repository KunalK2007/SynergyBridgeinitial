"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { GamificationProfile } from "@/types/gamification";
import { getLevelProgress } from "@/lib/utils/gamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Zap, Trophy } from "lucide-react";
import Link from "next/link";

export function GamificationProgressWidget() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      try {
        const pDoc = await getDoc(doc(db, "gamificationProfiles", currentUser.uid));
        if (pDoc.exists()) {
          setProfile(pDoc.data() as GamificationProfile);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  if (loading) {
    return <Card className="bg-slate-900 border-slate-800 h-full min-h-[200px] flex items-center justify-center"><p className="text-slate-400">Loading progress...</p></Card>;
  }

  if (!profile) {
    return (
      <Card className="bg-slate-900 border-slate-800 h-full">
        <CardHeader>
          <CardTitle>My Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 mb-4">Complete your profile to start earning XP and unlock achievements!</p>
          <Link href="/dashboard/profile" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
            Complete Profile &rarr;
          </Link>
        </CardContent>
      </Card>
    );
  }

  const progress = getLevelProgress(profile.xp);

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-indigo-950/20 border-indigo-500/20 h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Trophy className="w-24 h-24 text-indigo-400" />
      </div>
      <CardHeader>
        <CardTitle className="text-lg flex justify-between items-center">
          <span>My Progress</span>
          <Link href="/dashboard/student/gamification" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded">
            Details
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full border-2 border-indigo-500/30 flex items-center justify-center bg-slate-950 relative">
            <span className="text-xl font-black text-white">{profile.level}</span>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Level {profile.level}</h3>
            <p className="text-sm text-indigo-400 font-medium">{profile.xp} Total XP</p>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>{progress.xpForCurrentLevel} XP</span>
            <span>Next: Level {profile.level + 1}</span>
          </div>
          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-indigo-500 rounded-full relative overflow-hidden" 
              style={{ width: `${progress.progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ transform: "translateX(-100%)" }}></div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-slate-300">{profile.currentStreak} Day Streak</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-medium text-slate-300">{profile.totalAchievements} Achievements</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
