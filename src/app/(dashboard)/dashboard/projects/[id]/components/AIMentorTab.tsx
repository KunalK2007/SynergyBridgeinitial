"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, addDoc, onSnapshot, orderBy, setDoc, doc } from "firebase/firestore";
import { Project } from "@/types/project";
import { MentorMessage } from "@/types/ai-mentor";
import { Button } from "@/components/ui/Button";
import { Send, Bot, User, AlertCircle, Loader2 } from "lucide-react";

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
      alert("Failed to get AI response. Check rate limits or connection.");
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
      alert("Help request sent to your human mentor.");
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to escalate");
    } finally {
      setEscalating(false);
    }
  };

  if (!currentUser || currentUser.role !== "STUDENT") {
    return <div className="text-slate-400 p-8 text-center">AI Mentor is only available for students.</div>;
  }

  return (
    <div className="flex flex-col h-[600px] border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
      <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center">
         <h3 className="text-white font-medium flex items-center gap-2">
           <Bot className="w-5 h-5 text-indigo-400" /> AI Workspace Mentor
         </h3>
         <Button 
           variant="outline" 
           size="sm" 
           onClick={handleEscalate} 
           disabled={escalating}
           className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
         >
           {escalating ? "Requesting..." : "Request Mentor Help"}
         </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Bot className="w-10 h-10 mb-3 opacity-50" />
              <p className="text-sm">Ask a question about this project&apos;s tasks, milestones, or your skill gaps.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "STUDENT" ? "justify-end" : "justify-start"}`}>
                {m.role === "AI" && <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0"><Bot className="w-4 h-4"/></div>}
                
                <div className={`max-w-[80%] rounded-xl p-3 ${
                  m.role === "STUDENT" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-200 border border-slate-700"
                }`}>
                  <div className="whitespace-pre-wrap text-sm">{String(m.content)}</div>
                  
                  {m.role === "AI" && m.metadata && m.metadata.escalationRecommended === true && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                       <Button size="sm" variant="outline" className="w-full border-rose-500/30 text-rose-400 hover:bg-rose-500/10 h-7 text-xs" onClick={handleEscalate} disabled={escalating}>
                         Request Mentor Help
                       </Button>
                    </div>
                  )}
                </div>

                {m.role === "STUDENT" && <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 shrink-0"><User className="w-4 h-4"/></div>}
              </div>
            ))
          )}
          {loading && (
             <div className="flex gap-3 justify-start">
               <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0"><Bot className="w-4 h-4"/></div>
               <div className="bg-slate-800 rounded-xl p-3 flex items-center gap-2 text-slate-400 text-sm">
                 <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
               </div>
             </div>
          )}
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-900">
         <form onSubmit={handleSend} className="flex gap-2">
           <input
             type="text"
             value={input}
             onChange={(e) => setInput(e.target.value)}
             placeholder="Ask about this project..."
             disabled={loading}
             className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
           />
           <Button type="submit" disabled={!input.trim() || loading} size="icon" className="bg-indigo-600 hover:bg-indigo-500 text-white w-9 h-9">
             <Send className="w-4 h-4" />
           </Button>
         </form>
      </div>
    </div>
  );
}
