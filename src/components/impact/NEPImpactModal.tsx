"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  GraduationCap, 
  TrendingUp, 
  Building2, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Award
} from "lucide-react";

export function NEPImpactModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-bold border-[#9C7A4C]/30 text-[#9C7A4C] dark:text-[#C4A880] hover:bg-[#9C7A4C]/10 transition-all"
      >
        <GraduationCap className="w-4 h-4 text-[#9C7A4C] dark:text-[#C4A880]" />
        <span>NEP 2020 & ROI Framework</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#F6F5F2] dark:bg-[#131722] border border-[#5B5F73]/20 dark:border-[#252A3D] shadow-2xl p-6 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#5B5F73]/15 dark:border-[#252A3D]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#9C7A4C]/15 text-[#9C7A4C] dark:text-[#C4A880] border border-[#9C7A4C]/30">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">
                    NEP 2020 Compliance & Commercialization Economics
                  </h2>
                  <p className="text-xs text-[#5B5F73] dark:text-[#9499AD]">
                    Institutional credit transfer, MSME cost-efficiency, and sustainable business model.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#5B5F73] hover:text-[#1C1C1E] dark:hover:text-[#F3F4F6] hover:bg-[#EFEDE8] dark:hover:bg-[#1E2336] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* 1. NEP 2020 Academic Credit Framework */}
              <Card className="p-4 space-y-3 bg-white dark:bg-[#161926] border-[#5B5F73]/15 dark:border-[#252A3D]">
                <div className="flex items-center gap-2 text-sm font-bold text-[#9C7A4C] dark:text-[#C4A880]">
                  <Award className="w-4 h-4" />
                  <span>Academic Bank of Credits (ABC)</span>
                </div>
                <div className="space-y-2 text-xs text-[#5B5F73] dark:text-[#9499AD]">
                  <div className="flex justify-between p-2 rounded-md bg-[#EFEDE8]/50 dark:bg-[#1A1E2E]">
                    <span className="font-semibold text-[#1C1C1E] dark:text-[#F3F4F6]">Credit Calculation:</span>
                    <span>1 Credit = 30 Practical Capstone Hours</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-md bg-[#EFEDE8]/50 dark:bg-[#1A1E2E]">
                    <span className="font-semibold text-[#1C1C1E] dark:text-[#F3F4F6]">Standard Outcome:</span>
                    <span>4 Academic Credits (120 Hours)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-md bg-[#EFEDE8]/50 dark:bg-[#1A1E2E]">
                    <span className="font-semibold text-[#1C1C1E] dark:text-[#F3F4F6]">NHEQF Level:</span>
                    <span>Level 7 (B.Tech) / Level 8 (M.Tech)</span>
                  </div>
                </div>
              </Card>

              {/* 2. MSME / Industry R&D Economics */}
              <Card className="p-4 space-y-3 bg-white dark:bg-[#161926] border-[#5B5F73]/15 dark:border-[#252A3D]">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>MSME R&D Cost Savings (89%)</span>
                </div>
                <div className="space-y-2 text-xs text-[#5B5F73] dark:text-[#9499AD]">
                  <div className="flex justify-between p-2 rounded-md bg-[#EFEDE8]/50 dark:bg-[#1A1E2E]">
                    <span>Agency Outsourced R&D:</span>
                    <span className="font-mono text-rose-500 font-bold">₹4,50,000</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-md bg-[#EFEDE8]/50 dark:bg-[#1A1E2E]">
                    <span>SynergyBridge Capstone Grant:</span>
                    <span className="font-mono text-emerald-500 font-bold">₹50,000</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
                    <span>Direct Industry Savings:</span>
                    <span>₹4,00,000 per project</span>
                  </div>
                </div>
              </Card>

              {/* 3. Platform Business & Monetization Model */}
              <Card className="p-4 space-y-3 bg-white dark:bg-[#161926] border-[#5B5F73]/15 dark:border-[#252A3D]">
                <div className="flex items-center gap-2 text-sm font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">
                  <Building2 className="w-4 h-4 text-[#9C7A4C]" />
                  <span>Platform Monetization Streams</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#5B5F73] dark:text-[#9499AD]">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>University SaaS Tier</strong>: ₹2.5 Lakhs/year for NAAC/NIRF automated accreditation analytics.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Industry Escrow Fee</strong>: 5% service fee on milestone micro-grants.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>CSR & Govt Grants</strong>: DST/MSME innovation grant routing.</span>
                  </li>
                </ul>
              </Card>

              {/* 4. Verification & Trust Framework */}
              <Card className="p-4 space-y-3 bg-white dark:bg-[#161926] border-[#5B5F73]/15 dark:border-[#252A3D]">
                <div className="flex items-center gap-2 text-sm font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                  <span>Accreditation & NAAC/NIRF Impact</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#5B5F73] dark:text-[#9499AD]">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                    <span><strong>NAAC Criterion 3</strong>: Research, Innovations & Industry Extension metrics.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                    <span><strong>NIRF Innovation Parameter</strong>: Direct telemetry tracking patents, commercial prototypes, and funded startups.</span>
                  </li>
                </ul>
              </Card>

            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-[#5B5F73]/15 dark:border-[#252A3D]">
              <Button onClick={() => setIsOpen(false)} className="bg-[#9C7A4C] text-white">
                Close Framework
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
