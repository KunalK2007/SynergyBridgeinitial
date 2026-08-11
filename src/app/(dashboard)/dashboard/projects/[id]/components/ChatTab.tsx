"use client";

import { useEffect, useState, useRef } from "react";
import { collection, query, where, orderBy, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Project } from "@/types/project";
import { ProjectMessage } from "@/types/project-message";
import { Button } from "@/components/ui/Button";
import { Send } from "lucide-react";
import { logProjectActivity } from "@/lib/utils/project-activity";
import { ActivityType } from "@/types/project-activity";
import toast from "react-hot-toast";

interface Props {
  project: Project;
}

export default function ChatTab({ project }: Props) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "projectMessages"),
      where("projectId", "==", project.id),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProjectMessage));
      setMessages(msgs);
      setLoading(false);
      // Scroll to bottom shortly after receiving
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, (err) => {
      console.error("Chat error", err);
      toast.error("Failed to load chat");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [project.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;
    
    const text = newMessage;
    setNewMessage(""); // Optimistic clear

    try {
      await addDoc(collection(db, "projectMessages"), {
        projectId: project.id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || "User",
        message: text,
        createdAt: Date.now()
      });

      await logProjectActivity(
        project.id,
        currentUser.uid,
        currentUser.displayName || "User",
        ActivityType.CHAT_MESSAGE,
        "MESSAGE",
        undefined,
        { textPreview: text.substring(0, 30) }
      );
    } catch (err) {
      console.error("Failed to send message", err);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="flex flex-col h-[500px] border border-slate-800 bg-slate-900 rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
        {loading && <div className="text-slate-500 text-center text-sm">Loading chat...</div>}
        {!loading && messages.length === 0 && (
          <div className="text-slate-500 text-center text-sm mt-10">
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.senderId === currentUser?.uid;
          
          // Role identifier (simplified)
          let roleBadge = null;
          if (msg.senderId === project.mentorId) roleBadge = <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-400 px-1 rounded uppercase font-bold">Mentor</span>;
          if (msg.senderId === project.coordinatorId) roleBadge = <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-400 px-1 rounded uppercase font-bold">Coordinator</span>;

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div className="flex items-center mb-1">
                <span className="text-xs text-slate-400 font-semibold">{isMe ? "You" : msg.senderName}</span>
                {roleBadge}
                <span className="text-[10px] text-slate-500 ml-2">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`px-4 py-2 rounded-xl max-w-[80%] ${
                isMe ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-200"
              }`}>
                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950 rounded-b-lg">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <Button type="submit" disabled={!newMessage.trim()} className="bg-indigo-600 hover:bg-indigo-700">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
