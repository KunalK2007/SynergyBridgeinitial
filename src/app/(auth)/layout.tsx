import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#1E2135] p-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#9C7A4C]/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#9C7A4C]/10 blur-[120px]" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center flex flex-col items-center justify-center">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9C7A4C] shadow-lg shadow-[#9C7A4C]/20 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-[#9C7A4C]">
              SynergyBridge
            </span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
