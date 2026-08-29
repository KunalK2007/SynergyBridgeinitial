"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthContext";
import { 
  LayoutDashboard, 
  Settings, 
  User, 
  LogOut, 
  Menu, 
  X,
  BookOpen,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { JudgeRoleSwitcher } from "@/components/layout/JudgeRoleSwitcher";
import { NEPImpactModal } from "@/components/impact/NEPImpactModal";
import { getOperationMode } from "@/app/actions";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { currentUser, role, logout } = useAuth();
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    getOperationMode().then(mode => setIsRecoveryMode(mode === "RECOVERY"));
  }, []);

  // Basic navigation items
  const navigation: SidebarItem[] = [
    { name: "Dashboard", href: role ? `/dashboard/${role.toLowerCase()}` : "/dashboard", icon: LayoutDashboard },
    { name: "Problems", href: "/dashboard/problems", icon: BookOpen },
    { name: "Projects", href: "/dashboard/projects", icon: Briefcase },
    { name: "Profile", href: "/dashboard/profile", icon: User },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F6F5F2] dark:bg-[#0B0D14] text-[#1C1C1E] dark:text-[#F3F4F6] flex flex-col md:flex-row transition-colors duration-200">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[#2E3350] dark:border-[#1F2336] bg-[#1E2135] dark:bg-[#0F111A]">
        <span className="text-xl font-bold text-[#9C7A4C] dark:text-[#C4A880]">SynergyBridge</span>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-[#F6F5F2] hover:bg-[#262B45] dark:hover:bg-[#161926]">
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-[#1E2135] dark:bg-[#0F111A] border-r border-[#2E3350] dark:border-[#1F2336] transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 hidden md:block">
            <span className="text-2xl font-bold text-[#9C7A4C] dark:text-[#C4A880] tracking-tight">SynergyBridge</span>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-[#9C7A4C] text-white shadow-xs"
                      : "text-[#F6F5F2]/80 hover:bg-[#262B45] dark:hover:bg-[#161926] hover:text-[#F6F5F2]"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[#2E3350] dark:border-[#1F2336]">
            <div className="flex items-center space-x-3 mb-4 px-2">
              <div className="h-8 w-8 rounded-full bg-[#262B45] dark:bg-[#1A1E2E] flex items-center justify-center text-sm font-medium text-[#F6F5F2] uppercase border border-[#2E3350] dark:border-[#252A3D]">
                {currentUser?.displayName?.[0] || "U"}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[#F6F5F2] truncate max-w-[140px]">
                  {currentUser?.displayName}
                </span>
                <span className="text-xs text-[#5B5F73] dark:text-[#9499AD] capitalize">{role?.toLowerCase()}</span>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-[#262B45] dark:hover:bg-[#161926]" onClick={logout}>
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Demonstration & Impact Bar */}
        <div className="px-4 py-2.5 md:px-8 border-b border-[#5B5F73]/10 dark:border-[#1F2336] bg-[#EFEDE8]/40 dark:bg-[#0F111A] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#5B5F73] dark:text-[#9499AD]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="font-semibold text-[#1C1C1E] dark:text-[#F3F4F6]">Active Workspace:</span>
            <span className="capitalize">{role?.toLowerCase() || "Innovator"}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <NEPImpactModal />
            <JudgeRoleSwitcher />
          </div>
        </div>

        {isRecoveryMode && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-red-500 font-bold text-lg">⚠</span>
              <div>
                <p className="text-red-500 font-semibold">⚠ SynergyBridge Recovery Mode</p>
                <p className="text-red-400 text-sm">Funding and verification actions are temporarily paused while transaction records are being validated.</p>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
