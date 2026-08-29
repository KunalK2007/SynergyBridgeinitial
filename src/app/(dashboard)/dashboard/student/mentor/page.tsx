"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, addDoc, onSnapshot, orderBy, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { Project } from "@/types/project";
import { MentorMessage } from "@/types/ai-mentor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Send, Bot, User, AlertCircle, Info, Loader2 } from "lucide-react";

export default function AIMentorPage() {
  const { currentUser, firebaseUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProjects() {
      if (!currentUser) return;
      try {
        const snap = await getDocs(query(collection(db, "projects"), where("studentIds", "array-contains", currentUser.uid)));
        const projs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)).filter(p => p.status !== "COMPLETED");
        setProjects(projs);
        if (projs.length > 0) {
          setSelectedProjectId(projs[0].id);
        }
      } catch (err) {
        console.error("Failed to load projects", err);
      }
    }
    loadProjects();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !selectedProjectId) return;

    // Load or create conversation for this project
    const loadConversation = async () => {
      const q = query(
        collection(db, "mentorConversations"), 
        where("studentId", "==", currentUser.uid),
        where("projectId", "==", selectedProjectId)
      );
      const snap = await getDocs(q);
      
      let convId = null;
      if (snap.empty) {
        // Create new conversation
        const newConvRef = doc(collection(db, "mentorConversations"));
        await setDoc(newConvRef, {
          projectId: selectedProjectId,
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
  }, [currentUser, selectedProjectId]);

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
    if (!input.trim() || !conversationId || !selectedProjectId || !firebaseUser) return;
    
    const text = input.trim();
    setInput("");
    setLoading(true);

    try {
      const idToken = await firebaseUser.getIdToken();
      
      // Save user message to firestore manually here for immediate UI update, or let server do it?
      // For real-time feel, write user message to firestore:
      const msgRef = collection(db, "mentorConversations", conversationId, "messages");
      await addDoc(msgRef, {
        conversationId,
        projectId: selectedProjectId,
        studentId: currentUser?.uid,
        role: "STUDENT",
        content: text,
        contextVersion: "v1",
        createdAt: Date.now()
      });

      // Prepare history for AI
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
          projectId: selectedProjectId,
          userPrompt: text,
          history
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const aiData = await res.json();
      
      // Save AI message to firestore
      await addDoc(msgRef, {
        conversationId,
        projectId: selectedProjectId,
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
      // Optional: Add error message locally
      alert("Failed to get AI response. Check rate limits or connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = (text: string) => {
    setInput(text);
  };

  if (!currentUser) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col gap-4">
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-lg border border-slate-800">
        <div className="flex items-center gap-3 text-indigo-400">
          <Bot className="w-6 h-6" />
          <h1 className="text-lg font-bold text-white">AI Mentor</h1>
        </div>
        {projects.length > 0 && (
          <select 
            className="bg-slate-950 border border-slate-800 rounded px-3 py-1 text-sm text-white"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        )}
      </div>

      <Card className="flex-1 flex flex-col bg-slate-900 border-slate-800 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Bot className="w-12 h-12 mb-4 opacity-50" />
              <p>Ask a question about your project, skill gaps, or next steps.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "STUDENT" ? "justify-end" : "justify-start"}`}>
                {m.role === "AI" && <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0"><Bot className="w-5 h-5"/></div>}
                
                <div className={`max-w-[80%] rounded-xl p-3 ${
                  m.role === "STUDENT" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-200 border border-slate-700"
                }`}>
                  <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                  
                  {m.role === "AI" && m.metadata && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap items-center gap-2 text-xs">
                       <span className={`flex items-center gap-1 ${
                         (m.metadata.grounding as string) === 'GROUNDED' ? 'text-emerald-400' : 'text-amber-400'
                       }`}>
                         {(m.metadata.grounding as string) === 'GROUNDED' ? <CheckCircle className="w-3 h-3"/> : <AlertCircle className="w-3 h-3"/>}
                         {(m.metadata.grounding as string)}
                       </span>
                       <span className="text-slate-500">Confidence: {(m.metadata.confidence as string)}</span>
                       
                       {m.metadata.escalationRecommended === true && (
                         <div className="w-full mt-2 bg-rose-500/10 border border-rose-500/20 rounded p-2 text-rose-400 flex items-center gap-2">
                           <Info className="w-4 h-4 shrink-0" />
                           This issue might require human review. Consider requesting mentor help.
                         </div>
                       )}
                    </div>
                  )}
                </div>

                {m.role === "STUDENT" && <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 shrink-0"><User className="w-5 h-5"/></div>}
              </div>
            ))
          )}
          {loading && (
             <div className="flex gap-3 justify-start">
               <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0"><Bot className="w-5 h-5"/></div>
               <div className="bg-slate-800 rounded-xl p-3 flex items-center gap-2 text-slate-400">
                 <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
               </div>
             </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
           {messages.length === 0 && (
             <div className="flex gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
               {["What should I work on next?", "Explain my skill gaps", "Help me plan my next milestone"].map(s => (
                 <button key={s} onClick={() => handleSuggest(s)} className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors">
                   {s}
                 </button>
               ))}
             </div>
           )}
           <form onSubmit={handleSend} className="flex gap-2">
             <input
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder={selectedProjectId ? "Ask about your project..." : "Select a project first"}
               disabled={!selectedProjectId || loading}
               className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
             />
             <Button type="submit" disabled={!input.trim() || !selectedProjectId || loading} className="bg-indigo-600 hover:bg-indigo-500 text-white">
               <Send className="w-4 h-4" />
             </Button>
           </form>
        </div>
      </Card>
    </div>
  );
}

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
