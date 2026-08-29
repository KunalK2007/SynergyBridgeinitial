"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronDown, UserCheck, Shield, GraduationCap, Building2, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

const DEMO_PERSONAS = [
  {
    role: "STUDENT",
    name: "Aarav Sharma",
    email: "student.demo@synergybridge.local",
    pass: "SBStudent@2026!",
    dest: "/dashboard/student",
    icon: GraduationCap,
    desc: "Student Innovator",
    badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  {
    role: "MENTOR",
    name: "Dr. Rahul Mehta",
    email: "mentor.demo@synergybridge.local",
    pass: "SBMentor@2026!",
    dest: "/dashboard/mentor",
    icon: UserCheck,
    desc: "Expert Project Mentor",
    badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
  },
  {
    role: "FACULTY",
    name: "Prof. Vikram Joshi",
    email: "institution.demo@synergybridge.local",
    pass: "SBInstitution@2026!",
    dest: "/dashboard/faculty",
    icon: Building2,
    desc: "Institutional Authority",
    badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
  },
  {
    role: "INDUSTRY",
    name: "Neha Deshmukh",
    email: "reviewer.demo@synergybridge.local",
    pass: "SBReviewer@2026!",
    dest: "/dashboard/industry",
    icon: Briefcase,
    desc: "Industry Partner / Reviewer",
    badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  {
    role: "ADMIN",
    name: "System Admin",
    email: "admin.demo@synergybridge.local",
    pass: "SBAdmin@2026!",
    dest: "/dashboard/admin",
    icon: Shield,
    desc: "Platform Governance",
    badgeColor: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
  },
];

export function JudgeRoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const router = useRouter();

  const handleQuickSwitch = async (persona: typeof DEMO_PERSONAS[0]) => {
    setSwitching(persona.role);
    try {
      await signInWithEmailAndPassword(auth, persona.email, persona.pass);
      toast.success(`Switched role to ${persona.name} (${persona.role})`);
      setIsOpen(false);
      router.push(persona.dest);
    } catch (err) {
      console.warn("Demo signin exception, redirecting directly:", err);
      toast.success(`Navigating to ${persona.role} dashboard`);
      setIsOpen(false);
      router.push(persona.dest);
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#9C7A4C]/15 hover:bg-[#9C7A4C]/25 text-[#9C7A4C] dark:text-[#C4A880] border border-[#9C7A4C]/30 transition-all shadow-xs"
        title="Quick Role Switcher for Hackathon Judges"
      >
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#9C7A4C] dark:text-[#C4A880]" />
        <span>Judge Demo Switcher</span>
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="origin-top-right absolute right-0 mt-2 w-72 rounded-xl shadow-2xl bg-white dark:bg-[#131722] border border-[#5B5F73]/20 dark:border-[#252A3D] divide-y divide-[#5B5F73]/10 dark:divide-[#252A3D] z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3 bg-[#EFEDE8]/50 dark:bg-[#1A1E2E] rounded-t-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E] dark:text-[#F3F4F6] flex items-center justify-between">
                <span>Fast-Track Demo Roles</span>
                <span className="text-[10px] text-[#9C7A4C] dark:text-[#C4A880] font-mono">1-Click</span>
              </div>
              <p className="text-[11px] text-[#5B5F73] dark:text-[#9499AD] mt-0.5">
                Instantly explore multi-tenant workflows without manual logout.
              </p>
            </div>

            <div className="p-1.5 space-y-1">
              {DEMO_PERSONAS.map((p) => {
                const Icon = p.icon;
                const isSelected = switching === p.role;

                return (
                  <button
                    key={p.role}
                    type="button"
                    disabled={switching !== null}
                    onClick={() => handleQuickSwitch(p)}
                    className="w-full text-left p-2 rounded-lg hover:bg-[#EFEDE8]/60 dark:hover:bg-[#1E2336] transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-[#EFEDE8] dark:bg-[#1A1E2E] flex items-center justify-center text-[#9C7A4C] dark:text-[#C4A880] shrink-0 border border-[#5B5F73]/10 dark:border-[#252A3D]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#1C1C1E] dark:text-[#F3F4F6] group-hover:text-[#9C7A4C] dark:group-hover:text-[#C4A880] transition-colors">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-[#5B5F73] dark:text-[#9499AD]">
                          {p.desc}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${p.badgeColor}`}>
                      {isSelected ? "..." : p.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
