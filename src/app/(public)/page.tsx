import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Lightbulb, Users, Target, Award } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-24 md:py-32 lg:py-48 bg-[#1E2135] text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-[#F6F5F2] mb-6">
            Real Problems. <br className="hidden md:block" />
            <span className="text-[#9C7A4C]">Student Innovation.</span> <br className="hidden md:block" />
            Measurable Impact.
          </h1>
          <p className="text-lg md:text-xl text-[#5B5F73] max-w-3xl mx-auto mb-10">
            SynergyBridge connects students, academia, industry and government to transform real-world challenges into measurable solutions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/explore/problems">
              <Button size="lg" className="w-full sm:w-auto text-base">
                Explore Problems
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base border-[#5B5F73] text-[#F6F5F2] hover:bg-[#262B45]">
                How SynergyBridge Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Lifecycle Section */}
      <section className="w-full py-20 bg-[#F6F5F2]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#1C1C1E] mb-16">The Innovation Lifecycle</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-center">
            {[
              { icon: Target, title: "Problem", desc: "Real-world challenges posted by industry & gov" },
              { icon: Users, title: "Match", desc: "AI-driven team and mentor formation" },
              { icon: Lightbulb, title: "Build", desc: "Collaborative development workspace" },
              { icon: Target, title: "Validate", desc: "Expert review and testing" },
              { icon: Award, title: "Impact", desc: "Verified certificates & blockchain proof" }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#9C7A4C]/10 text-[#9C7A4C] mb-4">
                  <step.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-[#1C1C1E] mb-2">{step.title}</h3>
                <p className="text-sm text-[#5B5F73]">{step.desc}</p>
                {i < 4 && <ArrowRight className="hidden md:block absolute translate-x-[90px] translate-y-6 text-[#5B5F73] h-6 w-6" />}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
