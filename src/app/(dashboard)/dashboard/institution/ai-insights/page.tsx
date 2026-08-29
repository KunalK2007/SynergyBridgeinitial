import { Metadata } from "next";
import { StrategicInsightsClient } from "@/features/ai-insights/components/StrategicInsightsClient";

export const metadata: Metadata = {
  title: "AI Strategic Insights | SynergyBridge",
  description: "Natural-language AI strategic insights for institutional administrators.",
};

export default function AIInsightsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1C1C1E]">AI Strategic Insights</h1>
        <p className="text-[#5B5F73] mt-2">
          Ask natural-language questions about your institution&apos;s performance and get grounded, evidence-based recommendations.
        </p>
      </div>

      <StrategicInsightsClient />
    </div>
  );
}
