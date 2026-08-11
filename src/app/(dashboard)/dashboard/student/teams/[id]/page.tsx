"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Team } from "@/types/team";
import { InvitationStatus } from "@/types/team-invitation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ArrowLeft, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { createNotification } from "@/lib/services/notifications";
import { NotificationType } from "@/types/notification";

export default function TeamDetailPage() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteeId, setInviteeId] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    async function loadTeam() {
      if (!currentUser || !id) return;
      try {
        const teamSnap = await getDoc(doc(db, "teams", id as string));
        if (teamSnap.exists()) {
          const t = { id: teamSnap.id, ...teamSnap.data() } as Team;
          // Security: must be a member or admin
          if (t.memberIds.includes(currentUser.uid) || currentUser.role === "ADMIN") {
            setTeam(t);
          } else {
            toast.error("Unauthorized access to team");
            router.push("/dashboard/student/teams");
          }
        } else {
          toast.error("Team not found");
          router.push("/dashboard/student/teams");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, [id, currentUser, router]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !team) return;
    
    if (team.memberIds.includes(inviteeId)) {
      toast.error("User is already in the team");
      return;
    }
    
    setInviting(true);
    try {
      // Check for existing pending invite
      const q = query(
        collection(db, "teamInvitations"), 
        where("teamId", "==", team.id), 
        where("inviteeId", "==", inviteeId),
        where("status", "==", InvitationStatus.PENDING)
      );
      const snaps = await getDocs(q);
      if (!snaps.empty) {
        toast.error("Invitation already pending for this user");
        setInviting(false);
        return;
      }

      await addDoc(collection(db, "teamInvitations"), {
        teamId: team.id,
        inviterId: currentUser.uid,
        inviteeId,
        status: InvitationStatus.PENDING,
        createdAt: Date.now()
      });
      
      await createNotification(
        inviteeId,
        NotificationType.TEAM_INVITATION,
        "New Team Invitation",
        `You have been invited to join ${team.name}`,
        "/dashboard/student/teams"
      );

      toast.success("Invitation sent");
      setInviteeId("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  if (loading) return <div className="text-slate-400">Loading...</div>;
  if (!team) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Link href="/dashboard/student/teams" className="text-sm text-slate-400 hover:text-white flex items-center">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Teams
      </Link>
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">{team.name}</h1>
        <p className="text-slate-400 mt-2 flex items-center gap-2">
          <Users className="w-4 h-4" /> {team.memberIds.length} / {team.maxMembers} Members
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {team.memberIds.map(mid => (
                <li key={mid} className="text-sm text-slate-300 bg-slate-900 p-3 rounded border border-slate-800 flex justify-between">
                  <span>User ID: {mid.slice(0, 8)}...</span>
                  {mid === team.leaderId && <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-bold">Leader</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {currentUser?.uid === team.leaderId && team.memberIds.length < team.maxMembers && (
          <Card>
            <CardHeader>
              <CardTitle>Invite Member</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">User ID</label>
                  <input
                    type="text"
                    value={inviteeId}
                    onChange={(e) => setInviteeId(e.target.value)}
                    placeholder="Enter student User ID"
                    className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-white mt-1"
                    required
                  />
                </div>
                <Button type="submit" disabled={inviting} className="w-full">
                  <UserPlus className="w-4 h-4 mr-2" />
                  {inviting ? "Inviting..." : "Send Invite"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
