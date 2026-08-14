"use client";

import { auth } from "@/lib/firebase/client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { InstitutionalAIResponse } from "@/types/ai-institutional";

export function StrategicInsightsClient() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<InstitutionalAIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();

      const res = await fetch("/api/ai/institutional", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ question })
      });

      if (!res.ok) throw new Error(await res.text());
      const data: InstitutionalAIResponse = await res.json();
      setResponse(data);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ask SynergyBridge AI</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Input
              type="text"
              placeholder="e.g. Which skills should our institution prioritize?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !question.trim()}>
              {loading ? "Analyzing..." : "Ask"}
            </Button>
          </form>
          <div className="mt-2 text-sm text-[#5B5F73]">
            SynergyBridge AI analyzes your deterministic platform data to provide strategic insights.
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {response && (
        <div className="space-y-6">
          {response.groundingStatus === "INSUFFICIENT_DATA" && (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
              <h4 className="font-semibold">Insufficient Data</h4>
              <p>The available analytics are insufficient to answer this question reliably. This may be due to cohort sizes being below the privacy threshold.</p>
            </div>
          )}

          {response.limitations.length > 0 && (
            <div className="p-4 bg-[#9C7A4C]/5 text-[#1C1C1E] rounded-md border border-[#9C7A4C]/20 text-sm">
              <h4 className="font-semibold mb-1 text-[#9C7A4C]">Data Limitations</h4>
              <ul className="list-disc pl-5 text-[#5B5F73]">
                {response.limitations.map((limit, i) => (
                  <li key={i}>{limit}</li>
                ))}
              </ul>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>AI Strategic Brief</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-[#1C1C1E] leading-relaxed">
                {response.answer}
              </div>

              {response.insights.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold border-b border-[#5B5F73]/20 pb-2 text-[#1C1C1E]">Key Insights</h3>
                  {response.insights.map((insight, idx) => (
                    <div key={idx} className="p-4 border border-[#5B5F73]/20 rounded-md bg-[#F6F5F2] space-y-2">
                      <h4 className="font-semibold text-[#9C7A4C]">{insight.title}</h4>

                      <div>
                        <span className="text-xs font-bold uppercase text-[#5B5F73] mr-2">Observation / Evidence:</span>
                        <span className="text-sm text-[#1C1C1E]">{insight.evidence}</span>
                      </div>

                      <div>
                        <span className="text-xs font-bold uppercase text-[#5B5F73] mr-2">Interpretation:</span>
                        <span className="text-sm text-[#1C1C1E]">{insight.explanation}</span>
                      </div>

                      <div className="pt-2 border-t border-[#5B5F73]/15 mt-2">
                        <span className="text-xs font-bold uppercase text-emerald-600 mr-2">Recommendation:</span>
                        <span className="text-sm text-[#1C1C1E]">{insight.recommendedAction}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
