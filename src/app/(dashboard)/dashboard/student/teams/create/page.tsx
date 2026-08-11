"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { TeamStatus } from "@/types/team";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function CreateTeamPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (name.length < 3) {
      toast.error("Team name must be at least 3 characters");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const teamData = {
        name,
        leaderId: currentUser.uid,
        memberIds: [currentUser.uid],
        institutionIds: [], // Would fetch from leader's profile ideally
        maxMembers,
        status: TeamStatus.FORMING,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const docRef = await addDoc(collection(db, "teams"), teamData);
      toast.success("Team created successfully");
      router.push(`/dashboard/student/teams/${docRef.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create team");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Link href="/dashboard/student/teams" className="text-sm text-slate-400 hover:text-white flex items-center">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Teams
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle>Create a New Team</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Team Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-white"
                placeholder="E.g., Syntax Squad"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Maximum Members</label>
              <input
                type="number"
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                min={2}
                max={10}
                className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-white"
                required
              />
              <p className="text-xs text-slate-500">Most problems recommend teams of 2 to 4 members.</p>
            </div>
            
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating..." : "Create Team"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
