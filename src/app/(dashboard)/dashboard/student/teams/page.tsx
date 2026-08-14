"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Team } from "@/types/team";
import { TeamInvitation, InvitationStatus } from "@/types/team-invitation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Users, Plus, Check, X } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createNotification } from "@/lib/services/notifications";
import { NotificationType } from "@/types/notification";

export default function StudentTeamsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      try {
        const teamsRef = collection(db, "teams");
        const qTeams = query(teamsRef, where("memberIds", "array-contains", currentUser.uid));
        const teamSnaps = await getDocs(qTeams);
        const loadedTeams = teamSnaps.docs.map(d => ({ id: d.id, ...d.data() } as Team));

        const invRef = collection(db, "teamInvitations");
        const qInv = query(invRef, where("inviteeId", "==", currentUser.uid), where("status", "==", InvitationStatus.PENDING));
        const invSnaps = await getDocs(qInv);
        const loadedInvs = invSnaps.docs.map(d => ({ id: d.id, ...d.data() } as TeamInvitation));

        setTeams(loadedTeams);
        setInvitations(loadedInvs);
      } catch (err) {
        console.error("Error loading teams", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  const handleInvitation = async (invitation: TeamInvitation, accept: boolean) => {
    if (!currentUser) return;
    try {
      const invRef = doc(db, "teamInvitations", invitation.id);
      if (accept) {
        const teamRef = doc(db, "teams", invitation.teamId);
        const teamSnap = await getDoc(teamRef);
        if (teamSnap.exists()) {
          const teamData = teamSnap.data() as Team;
          if (teamData.memberIds.length >= teamData.maxMembers) {
            toast.error("Team is already full");
            return;
          }
          await updateDoc(teamRef, {
            memberIds: [...teamData.memberIds, currentUser.uid],
            updatedAt: new Date().getTime()
          });
          await updateDoc(invRef, {
            status: InvitationStatus.ACCEPTED,
            respondedAt: new Date().getTime()
          });
          toast.success("Joined team!");
          await createNotification(
            invitation.inviterId,
            NotificationType.TEAM_INVITATION_ACCEPTED,
            "Invitation Accepted",
            "A user has accepted your team invitation.",
            `/dashboard/student/teams/${invitation.teamId}`
          );
          setTeams([...teams, teamData]);
        }
      } else {
        await updateDoc(invRef, {
          status: InvitationStatus.DECLINED,
          respondedAt: new Date().getTime()
        });
        toast.success("Declined invitation.");
        await createNotification(
          invitation.inviterId,
          NotificationType.TEAM_INVITATION_DECLINED,
          "Invitation Declined",
          "A user has declined your team invitation."
        );
      }
      setInvitations(invitations.filter(i => i.id !== invitation.id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to process invitation");
    }
  };

  if (loading) return <div className="text-[#5B5F73]">Loading teams...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1C1C1E] mb-2">My Teams</h1>
          <p className="text-[#5B5F73]">Manage your teams and invitations.</p>
        </div>
        <Button onClick={() => router.push("/dashboard/student/teams/create")}>
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      {invitations.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#1C1C1E]">Pending Invitations</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {invitations.map(inv => (
              <Card key={inv.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-[#1C1C1E]">Team Invitation</h3>
                    <p className="text-xs text-[#5B5F73] mt-1">From user {inv.inviterId.slice(0, 6)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={() => handleInvitation(inv, true)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => handleInvitation(inv, false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#1C1C1E]">Active Teams</h2>
        {teams.length === 0 ? (
          <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-lg p-8 text-center">
            <Users className="w-8 h-8 text-[#5B5F73]/40 mx-auto mb-3" />
            <p className="text-[#5B5F73]">You have not joined any teams yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map(team => (
              <Card key={team.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-[#5B5F73] space-y-2 mb-6">
                    <p>Members: {team.memberIds.length} / {team.maxMembers}</p>
                    <p>Status: <span className="text-[#1C1C1E]">{team.status}</span></p>
                  </div>
                  <Button onClick={() => router.push(`/dashboard/student/teams/${team.id}`)} variant="outline" className="w-full">
                    View Team
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
