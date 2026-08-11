import { auth } from "@/lib/firebase/client";
import { GamificationEventType } from "@/types/gamification";

export async function triggerGamificationEvent(eventType: GamificationEventType, sourceId: string, metadata?: Record<string, unknown>) {
  try {
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    
    // We don't await this because we don't want to block the UI.
    // The server handles it asynchronously.
    fetch("/api/gamification/process-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        eventType,
        sourceId,
        metadata
      })
    }).then(res => res.json()).then(data => {
      // If we wanted to trigger a local toast for XP, we could do it here
      // But we will rely on notifications for achievements.
      if (data.success && data.xpAwarded > 0) {
        console.log(`Earned ${data.xpAwarded} XP from ${eventType}`);
      }
    }).catch(console.error);
    
  } catch (error) {
    console.error("Failed to trigger gamification event", error);
  }
}
