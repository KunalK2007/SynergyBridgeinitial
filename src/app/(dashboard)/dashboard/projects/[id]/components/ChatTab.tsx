"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/purity */
import { useEffect, useState, useRef } from "react";
import { collection, query, where, orderBy, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Project } from "@/types/project";
import { ProjectMessage } from "@/types/project-message";
import { Button } from "@/components/ui/Button";
import { Send, UserCheck, MessageSquare } from "lucide-react";
import { logProjectActivity } from "@/lib/utils/project-activity";
import { ActivityType } from "@/types/project-activity";
import toast from "react-hot-toast";

interface Props {
  project: Project;
}

const DEFAULT_CROPGUARD_MESSAGES: ProjectMessage[] = [
  {
    id: "cg_msg_1",
    projectId: "demo_proj_1",
    senderId: "student.demo@synergybridge.local",
    senderName: "Aarav Sharma",
    message: "We've completed the initial crop disease dataset preparation.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 45,
  },
  {
    id: "cg_msg_2",
    projectId: "demo_proj_1",
    senderId: "mentor.demo@synergybridge.local",
    senderName: "Dr. Rahul Mehta",
    message: "Great. Before training the baseline model, verify that the classes are reasonably balanced.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 30,
  },
  {
    id: "cg_msg_3",
    projectId: "demo_proj_1",
    senderId: "student.demo@synergybridge.local",
    senderName: "Aarav Sharma",
    message: "We'll run the class distribution analysis today.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 15,
  },
  {
    id: "cg_msg_4",
    projectId: "demo_proj_1",
    senderId: "mentor.demo@synergybridge.local",
    senderName: "Dr. Rahul Mehta",
    message: "Perfect. Share the results here before moving to model evaluation.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 5,
  },
];

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
      if (!snapshot.empty) {
        const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProjectMessage));
        setMessages(msgs);
      } else {
        setMessages(DEFAULT_CROPGUARD_MESSAGES.map(m => ({ ...m, projectId: project.id })));
      }
      setLoading(false);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, (err) => {
      console.error("Chat error", err);
      setMessages(DEFAULT_CROPGUARD_MESSAGES.map(m => ({ ...m, projectId: project.id })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [project.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;
    
    const text = newMessage;
    setNewMessage("");

    const localMsg: ProjectMessage = {
      id: `msg_${Date.now()}`,
      projectId: project.id,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || "Aarav Sharma",
      message: text,
      createdAt: Date.now(),
    };

    setMessages(prev => [...prev, localMsg]);

    try {
      await addDoc(collection(db, "projectMessages"), {
        projectId: project.id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || "User",
        message: text,
        createdAt: Date.now()
      });

      try {
        await logProjectActivity(
          project.id,
          currentUser.uid,
          currentUser.displayName || "User",
          ActivityType.CHAT_MESSAGE,
          "MESSAGE",
          undefined,
          { textPreview: text.substring(0, 30) }
        );
      } catch {
        // Non-blocking
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <div className="flex flex-col h-[560px] border border-[#5B5F73]/20 bg-[#EFEDE8] rounded-2xl shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-[#5B5F73]/15 bg-white/70 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-[#1C1C1E] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#9C7A4C]" />
            Workspace Team & Mentor Chat
          </h3>
          <p className="text-xs text-[#5B5F73]">Real-time technical discussions and mentor advisory logs</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700">Online</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
        {messages.map(msg => {
          const isMe = msg.senderId === currentUser?.uid || msg.senderName === currentUser?.displayName;
          const isMentor = msg.senderName.includes("Dr.") || msg.senderName.includes("Mentor") || msg.senderId === project.mentorId;

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-xs font-bold text-[#1C1C1E]">
                  {isMe ? "You" : msg.senderName}
                </span>
                {isMentor ? (
                  <span className="text-[10px] bg-[#9C7A4C]/15 text-[#9C7A4C] px-1.5 py-0.2 rounded font-bold uppercase">
                    Mentor
                  </span>
                ) : (
                  <span className="text-[10px] bg-blue-500/10 text-blue-700 px-1.5 py-0.2 rounded font-bold uppercase">
                    Student Team
                  </span>
                )}
                <span className="text-[10px] text-[#5B5F73]">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className={`px-4 py-3 rounded-2xl max-w-[80%] shadow-sm ${
                isMe 
                  ? "bg-[#1C1C1E] text-white rounded-tr-none" 
                  : "bg-white text-[#1C1C1E] border border-[#5B5F73]/15 rounded-tl-none"
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-[#5B5F73]/15 bg-white">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message to your mentor and teammates..."
            className="flex-1 bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-xl px-4 py-2.5 text-sm text-[#1C1C1E] focus:outline-none focus:border-[#9C7A4C]"
          />
          <Button type="submit" disabled={!newMessage.trim()} className="bg-[#1C1C1E] text-white hover:bg-black px-5 rounded-xl">
            <Send className="w-4 h-4 mr-1.5" /> Send
          </Button>
        </form>
      </div>
    </div>
  );
}
