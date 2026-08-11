"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ProblemsDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">My Problems</h1>
          <p className="text-slate-400">Manage your drafted and published challenges.</p>
        </div>
        <Link href="/dashboard/problems/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Problem
          </Button>
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <h3 className="text-lg font-medium text-white mb-2">No problems yet</h3>
        <p className="text-slate-400 mb-6">You haven&apos;t created any challenges yet.</p>
        <Link href="/dashboard/problems/create">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create your first problem
          </Button>
        </Link>
      </div>
    </div>
  );
}
