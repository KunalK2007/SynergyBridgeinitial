import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F6F5F2]">
      <header className="sticky top-0 z-50 w-full border-b border-[#2E3350] bg-[#1E2135] backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tight text-[#9C7A4C]">SynergyBridge</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/explore/problems" className="text-[#F6F5F2]/80 hover:text-[#F6F5F2] transition-colors">Explore Problems</Link>
            <Link href="/showcase" className="text-[#F6F5F2]/80 hover:text-[#F6F5F2] transition-colors">Innovation Showcase</Link>
            <Link href="/verify" className="text-[#F6F5F2]/80 hover:text-[#F6F5F2] transition-colors">Verify Certificate</Link>
            <Link href="/about" className="text-[#F6F5F2]/80 hover:text-[#F6F5F2] transition-colors">About</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-[#F6F5F2]/80 hover:text-[#F6F5F2] hover:bg-[#262B45]">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-[#2E3350] bg-[#1E2135] py-8">
        <div className="container mx-auto px-4 text-center text-sm text-[#5B5F73]">
          © {new Date().getFullYear()} SynergyBridge. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
