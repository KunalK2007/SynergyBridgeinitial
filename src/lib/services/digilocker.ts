import { Certificate, ExternalCredentialStatus } from "@/types/certificate";

export async function pushCredentialToDigiLocker(certificate: Certificate) {
  // Simulated external API call
  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    status: ExternalCredentialStatus.MOCK,
    simulated: true,
    mode: "MOCK",
    referenceId: `digilocker-mock-${certificate.id}`,
    syncedAt: new Date().toISOString(),
  };
}
