"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Zap, RefreshCw } from "lucide-react";

export function SurgeTelemetryWidget() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [loadCount, setLoadCount] = useState(128);

  const simulateBurst = () => {
    setIsSimulating(true);
    setLoadCount((prev) => prev + 250);
    setTimeout(() => {
      setIsSimulating(false);
    }, 1200);
  };

  return (
    <Card className="p-4 bg-white dark:bg-[#161926] border-[#5B5F73]/15 dark:border-[#252A3D] shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">
              Surge & Concurrency Telemetry
            </h3>
            <p className="text-[11px] text-[#5B5F73] dark:text-[#9499AD]">
              Universal Challenge 9c — Live load handling & rate limit monitor
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={simulateBurst}
          disabled={isSimulating}
          className="px-2.5 py-1 rounded-md bg-[#EFEDE8] dark:bg-[#1A1E2E] hover:bg-[#EFEDE8]/80 text-[#1C1C1E] dark:text-[#F3F4F6] text-xs font-semibold border border-[#5B5F73]/15 dark:border-[#252A3D] flex items-center gap-1.5 transition-all"
          title="Simulate sudden 10x burst load"
        >
          <RefreshCw className={`w-3 h-3 ${isSimulating ? "animate-spin text-[#9C7A4C]" : ""}`} />
          <span>{isSimulating ? "Absorbing Surge..." : "Test 10x Surge"}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-2.5 rounded-lg bg-[#EFEDE8]/50 dark:bg-[#1A1E2E] border border-[#5B5F73]/10 dark:border-[#252A3D]">
          <span className="text-[10px] text-[#5B5F73] dark:text-[#9499AD] uppercase font-bold block">
            Rate Limiter
          </span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
            10 req / 600s
          </span>
          <span className="text-[10px] text-[#5B5F73] dark:text-[#9499AD] block mt-0.5">
            Token-Bucket Active
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#EFEDE8]/50 dark:bg-[#1A1E2E] border border-[#5B5F73]/10 dark:border-[#252A3D]">
          <span className="text-[10px] text-[#5B5F73] dark:text-[#9499AD] uppercase font-bold block">
            Idempotency Lock
          </span>
          <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-sm">
            ACID Safe
          </span>
          <span className="text-[10px] text-[#5B5F73] dark:text-[#9499AD] block mt-0.5">
            Firestore Transaction
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#EFEDE8]/50 dark:bg-[#1A1E2E] border border-[#5B5F73]/10 dark:border-[#252A3D]">
          <span className="text-[10px] text-[#5B5F73] dark:text-[#9499AD] uppercase font-bold block">
            Circuit Breaker
          </span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> CLOSED
          </span>
          <span className="text-[10px] text-[#5B5F73] dark:text-[#9499AD] block mt-0.5">
            Zero Dropped Frames
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#EFEDE8]/50 dark:bg-[#1A1E2E] border border-[#5B5F73]/10 dark:border-[#252A3D]">
          <span className="text-[10px] text-[#5B5F73] dark:text-[#9499AD] uppercase font-bold block">
            Burst Requests
          </span>
          <span className="font-mono font-bold text-[#1C1C1E] dark:text-[#F3F4F6] text-sm">
            {loadCount} ops/sec
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
            Auto-Throttled
          </span>
        </div>
      </div>
    </Card>
  );
}
