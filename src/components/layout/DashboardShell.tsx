"use client";

import { useState } from "react";
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

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { currentUser, role, logout } = useAuth();

  // Basic navigation items
  const navigation: SidebarItem[] = [
    { name: "Dashboard", href: role ? `/dashboard/${role.toLowerCase()}` : "/dashboard", icon: LayoutDashboard },
    { name: "Problems", href: "/dashboard/problems", icon: BookOpen },
    { name: "Projects", href: "/dashboard/projects", icon: Briefcase },
    { name: "Profile", href: "/dashboard/profile", icon: User },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F6F5F2] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[#2E3350] bg-[#1E2135]">
        <span className="text-xl font-bold text-[#9C7A4C]">SynergyBridge</span>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-[#F6F5F2] hover:bg-[#262B45]">
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-[#1E2135] border-r border-[#2E3350] transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 hidden md:block">
            <span className="text-2xl font-bold text-[#9C7A4C] tracking-tight">SynergyBridge</span>
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
                      ? "bg-[#9C7A4C] text-white"
                      : "text-[#F6F5F2]/80 hover:bg-[#262B45] hover:text-[#F6F5F2]"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[#2E3350]">
            <div className="flex items-center space-x-3 mb-4 px-2">
              <div className="h-8 w-8 rounded-full bg-[#262B45] flex items-center justify-center text-sm font-medium text-[#F6F5F2] uppercase">
                {currentUser?.displayName?.[0] || "U"}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[#F6F5F2] truncate max-w-[140px]">
                  {currentUser?.displayName}
                </span>
                <span className="text-xs text-[#5B5F73] capitalize">{role?.toLowerCase()}</span>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-[#262B45]" onClick={logout}>
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#1E2135]/80 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
