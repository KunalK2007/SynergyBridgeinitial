import { Certificate, ExternalCredentialStatus } from "@/types/certificate";

export async function submitAcademicCredits(certificate: Certificate, credits: number) {
  // Simulated external API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    status: ExternalCredentialStatus.MOCK,
    simulated: true,
    mode: "MOCK",
    creditsSubmitted: credits,
    referenceId: `abc-mock-${certificate.id}`,
    syncedAt: new Date().toISOString(),
  };
}
