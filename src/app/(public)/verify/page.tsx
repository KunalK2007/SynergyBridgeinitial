"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Search } from "lucide-react";

export default function VerifyIndexPage() {
  const [certId, setCertId] = useState("");
  const router = useRouter();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (certId.trim()) {
      router.push(`/verify/${certId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-12 flex flex-col items-center">
      <div className="max-w-xl w-full px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Verify a Certificate</h1>
          <p className="text-slate-400">
            Enter the unique Certificate ID to verify the authenticity of a SynergyBridge credential.
          </p>
        </div>

        <form onSubmit={handleVerify} className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
          <div className="mb-6">
            <label htmlFor="certId" className="block text-sm font-medium text-slate-300 mb-2">
              Certificate ID
            </label>
            <input
              id="certId"
              type="text"
              required
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
          <Button type="submit" className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700">
            <Search className="w-5 h-5 mr-2" />
            Verify Credential
          </Button>
        </form>
      </div>
    </div>
  );
}
