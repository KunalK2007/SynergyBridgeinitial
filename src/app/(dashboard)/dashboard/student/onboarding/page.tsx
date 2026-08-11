import { StudentOnboardingForm } from "@/features/profile/components/onboarding/StudentOnboardingForm";

export default function StudentOnboardingPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome to SynergyBridge</h1>
        <p className="text-slate-400">Let&apos;s build your capability profile to match you with real-world problems.</p>
      </div>
      <StudentOnboardingForm />
    </div>
  );
}
