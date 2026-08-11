import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tight text-blue-500">SynergyBridge</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/explore/problems" className="text-slate-300 hover:text-white transition-colors">Explore Problems</Link>
            <Link href="/showcase" className="text-slate-300 hover:text-white transition-colors">Innovation Showcase</Link>
            <Link href="/verify" className="text-slate-300 hover:text-white transition-colors">Verify Certificate</Link>
            <Link href="/about" className="text-slate-300 hover:text-white transition-colors">About</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
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
      <footer className="border-t border-slate-800 bg-slate-950 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} SynergyBridge. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
