import { Loader2 } from "lucide-react";

export default function DashboardIndexPage() {
  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#9C7A4C] mb-4" />
        <p className="text-sm text-[#5B5F73]">Loading your workspace...</p>
      </div>
    </div>
  );
}
