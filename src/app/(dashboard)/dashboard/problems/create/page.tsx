import { CreateProblemForm } from "@/features/problems/components/CreateProblemForm";

export default function CreateProblemPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1C1C1E] mb-2">Create Problem</h1>
        <p className="text-[#5B5F73]">Post a new real-world challenge to the SynergyBridge repository.</p>
      </div>

      <CreateProblemForm />
    </div>
  );
}
