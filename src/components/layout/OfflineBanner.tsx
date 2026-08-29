"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { useState } from "react";

export function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleManualCheck = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
    }, 1000);
  };

  // Completely online with no recent offline event -> don't render anything
  if (isOnline && !wasOffline) {
    return null;
  }

  // Back online after being offline -> show green sync toast
  if (isOnline && wasOffline) {
    return (
      <div 
        role="status"
        aria-live="polite"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92%] sm:w-auto px-4 py-2.5 rounded-full shadow-lg border backdrop-blur-md flex items-center justify-center gap-2.5 transition-all duration-300 animate-in fade-in slide-in-from-top-4 bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-medium"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span><strong>Back Online</strong> — Synchronized with SynergyBridge network.</span>
      </div>
    );
  }

  // Active offline state -> show amber warning banner
  return (
    <div 
      role="alert"
      aria-live="assertive"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-[92%] sm:w-auto px-4 py-2.5 rounded-full shadow-xl border backdrop-blur-md flex items-center justify-between gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-4 bg-amber-50/95 dark:bg-[#1A1811]/95 border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-medium"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <div>
          <span className="font-bold">Offline Mode Active</span>
          <span className="hidden sm:inline text-amber-700/80 dark:text-amber-300/80 ml-1.5">— Serving from resilient local cache.</span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleManualCheck}
        disabled={isRetrying}
        className="px-2.5 py-1 rounded-full bg-amber-200/60 dark:bg-amber-900/40 hover:bg-amber-300/60 dark:hover:bg-amber-800/40 text-amber-900 dark:text-amber-200 text-[11px] font-bold transition-all flex items-center gap-1 shrink-0"
        title="Check connection status"
      >
        <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
        <span>Check</span>
      </button>
    </div>
  );
}
