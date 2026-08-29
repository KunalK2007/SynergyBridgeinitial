"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, addDoc, onSnapshot, orderBy, setDoc, doc } from "firebase/firestore";
import { Project } from "@/types/project";
import { MentorMessage } from "@/types/ai-mentor";
import { Button } from "@/components/ui/Button";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  project: Project;
}

export default function AIMentorTab({ project }: Props) {
  const { currentUser, firebaseUser } = useAuth();
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [escalating, setEscalating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "STUDENT") return;

    const loadConversation = async () => {
      try {
        const q = query(
          collection(db, "mentorConversations"), 
          where("studentId", "==", currentUser.uid),
          where("projectId", "==", project.id)
        );
        const snap = await getDocs(q);
        
        let convId = null;
        if (snap.empty) {
          const newConvRef = doc(collection(db, "mentorConversations"));
          await setDoc(newConvRef, {
            projectId: project.id,
            studentId: currentUser.uid,
            title: "Project Mentor Chat",
            status: "ACTIVE",
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          convId = newConvRef.id;
        } else {
          convId = snap.docs[0].id;
        }
        setConversationId(convId);
      } catch (err) {
        console.error("Failed to load mentor conversation", err);
      }
    };
    
    loadConversation();
  }, [currentUser, project.id]);

  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = collection(db, "mentorConversations", conversationId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as MentorMessage));
      setMessages(msgs);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversationId || !firebaseUser) return;
    
    const text = input.trim();
    setInput("");
    setLoading(true);

    try {
      const idToken = await firebaseUser.getIdToken();
      
      const msgRef = collection(db, "mentorConversations", conversationId, "messages");
      await addDoc(msgRef, {
        conversationId,
        projectId: project.id,
        studentId: currentUser?.uid,
        role: "STUDENT",
        content: text,
        contextVersion: "v1",
        createdAt: Date.now()
      });

      const history = messages.slice(-10).map(m => ({
        role: m.role === "STUDENT" ? "user" : "model",
        content: m.content
      }));

      const res = await fetch("/api/ai/mentor-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          projectId: project.id,
          userPrompt: text,
          history
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const aiData = await res.json();
      
      await addDoc(msgRef, {
        conversationId,
        projectId: project.id,
        studentId: currentUser?.uid,
        role: "AI",
        content: aiData.answer,
        contextVersion: "v1",
        metadata: {
           grounding: aiData.grounding,
           confidence: aiData.confidence,
           escalationRecommended: aiData.escalationRecommended
        },
        createdAt: Date.now()
      });

    } catch (err) {
      console.error(err);
      toast.error("Failed to get AI response. Check rate limits or connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!firebaseUser || escalating) return;
    setEscalating(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch("/api/ai/escalate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ projectId: project.id })
      });
      if (!res.ok) {
         const data = await res.json();
         throw new Error(data.error || "Failed to escalate");
      }
      toast.success("Help request sent to your human mentor Dr. Rahul Mehta.");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to escalate");
    } finally {
      setEscalating(false);
    }
  };

  if (!currentUser || currentUser.role !== "STUDENT") {
    return <div className="text-[#5B5F73] p-8 text-center bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-xl">AI Mentor is only available for student workspace members.</div>;
  }

  return (
    <div className="flex flex-col h-[580px] border border-[#5B5F73]/20 rounded-2xl overflow-hidden bg-[#EFEDE8] shadow-sm">
      <div className="bg-white/80 p-4 border-b border-[#5B5F73]/15 flex justify-between items-center">
         <div>
           <h3 className="text-[#1C1C1E] font-bold flex items-center gap-2">
             <Bot className="w-5 h-5 text-[#9C7A4C]" /> AI Workspace Mentor
           </h3>
           <p className="text-xs text-[#5B5F73]">24/7 technical guidance on model architecture, data preprocessing, and evaluation</p>
         </div>
         <Button 
           variant="outline" 
           size="sm" 
           onClick={handleEscalate} 
           disabled={escalating}
           className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
         >
           {escalating ? "Requesting..." : "Request Human Mentor"}
         </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#5B5F73] text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-[#9C7A4C]/15 flex items-center justify-center mb-3 text-[#9C7A4C]">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#1C1C1E] mb-1">CropGuard AI Assistant</h4>
              <p className="text-xs text-[#5B5F73]">Ask a technical question about your dataset balance, MobileNet layers, or evaluation metrics.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "STUDENT" ? "justify-end" : "justify-start"}`}>
                {m.role === "AI" && (
                  <div className="w-8 h-8 rounded-full bg-[#9C7A4C]/15 flex items-center justify-center text-[#9C7A4C] shrink-0">
                    <Bot className="w-4 h-4"/>
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-2xl p-3.5 shadow-sm ${
                  m.role === "STUDENT" 
                    ? "bg-[#1C1C1E] dark:bg-[#262B45] text-white rounded-tr-none" 
                    : "bg-white dark:bg-[#161926] text-[#1C1C1E] dark:text-[#F3F4F6] border border-[#5B5F73]/15 dark:border-[#252A3D] rounded-tl-none"
                }`}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{String(m.content)}</div>
                  
                  {m.role === "AI" && m.metadata && m.metadata.escalationRecommended === true && (
                    <div className="mt-3 pt-3 border-t border-[#5B5F73]/15 dark:border-[#252A3D]">
                       <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-7 text-xs font-semibold" 
                        onClick={handleEscalate} 
                        disabled={escalating}
                       >
                         Request Human Mentor Escalation
                       </Button>
                    </div>
                  )}
                </div>

                {m.role === "STUDENT" && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                    <User className="w-4 h-4"/>
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
             <div className="flex gap-3 justify-start">
               <div className="w-8 h-8 rounded-full bg-[#9C7A4C]/15 flex items-center justify-center text-[#9C7A4C] shrink-0"><Bot className="w-4 h-4"/></div>
               <div className="bg-white rounded-2xl p-3 flex items-center gap-2 text-[#5B5F73] text-sm border border-[#5B5F73]/15">
                 <Loader2 className="w-4 h-4 animate-spin text-[#9C7A4C]" /> Analyzing query...
               </div>
             </div>
          )}
      </div>

      <div className="p-3.5 border-t border-[#5B5F73]/15 bg-white">
         <form onSubmit={handleSend} className="flex gap-2">
           <input
             type="text"
             value={input}
             onChange={(e) => setInput(e.target.value)}
             placeholder="Ask about this project's tasks, algorithms, or ML pipelines..."
             disabled={loading}
             className="flex-1 bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-xl px-4 py-2 text-sm text-[#1C1C1E] focus:outline-none focus:border-[#9C7A4C] disabled:opacity-50"
           />
           <Button type="submit" disabled={!input.trim() || loading} size="icon" className="bg-[#1C1C1E] hover:bg-black text-white w-9 h-9 rounded-xl">
             <Send className="w-4 h-4" />
           </Button>
         </form>
      </div>
    </div>
  );
}
