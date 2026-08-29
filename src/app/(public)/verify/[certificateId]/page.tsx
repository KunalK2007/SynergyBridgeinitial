"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckCircle, XCircle, HelpCircle, FileText, Calendar } from "lucide-react";

interface VerifyResponse {
  valid: boolean;
  status: string;
  verificationId?: string;
  projectTitle?: string;
  problemTitle?: string;
  studentName?: string;
  institution?: string;
  department?: string;
  academicCredits?: number;
  issuedAt?: string;
  credentialHash?: string;
  isDemo?: boolean;
  blockchain?: {
    status: string;
    simulated: boolean;
  };
  revokedAt?: string;
  error?: string;
}

export default function PublicVerificationPage() {
  const { certificateId } = useParams();
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function verify() {
      if (!certificateId) {
        if (isMounted) {
          setData({ valid: false, status: "NOT_FOUND" });
          setLoading(false);
        }
        return;
      }
      
      try {
        const res = await fetch(`/api/certificates/${certificateId}`);
        const json = (await res.json().catch(() => null)) as VerifyResponse | null;
        if (!res.ok && res.status !== 404) {
          throw new Error(json?.error || "Certificate verification service encountered an issue");
        }
        if (isMounted) {
          setData(json || { valid: false, status: "NOT_FOUND" });
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message || "Failed to verify certificate");
          setLoading(false);
        }
      }
    }

    verify();
    return () => {
      isMounted = false;
    };
  }, [certificateId]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0D14] flex items-center justify-center p-8">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-[#9C7A4C] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[#5B5F73] dark:text-[#9499AD]">Verifying credential on SynergyBridge verification network...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0D14] flex items-center justify-center p-8">
      <Card className="max-w-md w-full p-6 text-center space-y-4">
        <HelpCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">Verification Error</h2>
        <p className="text-sm text-[#5B5F73] dark:text-[#9499AD]">{error}</p>
      </Card>
    </div>
  );

  if (!data || data.status === "NOT_FOUND") return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0D14] flex items-center justify-center p-8">
      <Card className="max-w-md w-full p-8 text-center space-y-4 shadow-lg border-t-4 border-t-slate-400">
        <HelpCircle className="w-16 h-16 text-slate-400 mx-auto" />
        <h2 className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">Credential Not Found</h2>
        <p className="text-sm text-[#5B5F73] dark:text-[#9499AD]">
          No certificate matching the identifier <span className="font-mono font-semibold">{String(certificateId)}</span> was found in the authoritative registry.
        </p>
      </Card>
    </div>
  );

  const isIssued = data.status === "VERIFIED" || data.status === "ISSUED";
  const isRevoked = data.status === "REVOKED";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0D14] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Verification Status Header Card */}
        <Card className={`shadow-lg border-t-4 ${isIssued ? "border-t-emerald-500" : isRevoked ? "border-t-red-500" : "border-t-slate-400"}`}>
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-3">
              {isIssued ? (
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-emerald-500" />
                </div>
              ) : isRevoked ? (
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-500" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-500/10 flex items-center justify-center">
                  <HelpCircle className="h-10 w-10 text-slate-400" />
                </div>
              )}
            </div>

            <CardTitle className="text-2xl sm:text-3xl font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">
              {isIssued 
                ? "Verified Academic Credential" 
                : isRevoked 
                ? "Revoked Credential" 
                : "Credential Not Found"}
            </CardTitle>

            <CardDescription className="text-sm sm:text-base mt-1">
              Official SynergyBridge Project Outcome Verification
            </CardDescription>

            {data.isDemo && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
                <span>✦</span> Simulated Demo Credential
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {isIssued && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-white dark:bg-[#161926] border border-[#5B5F73]/15 dark:border-[#252A3D]">
                  <div className="space-y-1">
                    <p className="text-xs text-[#5B5F73] dark:text-[#9499AD] uppercase font-semibold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Recipient
                    </p>
                    <p className="font-bold text-[#1C1C1E] dark:text-[#F3F4F6] text-base">{data.studentName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-[#5B5F73] dark:text-[#9499AD] uppercase font-semibold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Institution
                    </p>
                    <p className="font-semibold text-[#1C1C1E] dark:text-[#F3F4F6]">{data.institution}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs text-[#5B5F73] dark:text-[#9499AD] uppercase font-semibold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Completed Project
                    </p>
                    <p className="font-semibold text-[#1C1C1E] dark:text-[#F3F4F6]">{data.projectTitle}</p>
                  </div>
                  {data.problemTitle && (
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-xs text-[#5B5F73] dark:text-[#9499AD] uppercase font-semibold flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Problem Solved
                      </p>
                      <p className="text-sm text-[#5B5F73] dark:text-[#9499AD]">{data.problemTitle}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs text-[#5B5F73] dark:text-[#9499AD] uppercase font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Issued Date
                    </p>
                    <p className="font-medium text-[#1C1C1E] dark:text-[#F3F4F6] text-sm">
                      {data.issuedAt ? new Date(data.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-[#5B5F73] dark:text-[#9499AD] uppercase font-semibold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Academic Credits
                    </p>
                    <p className="font-medium text-[#1C1C1E] dark:text-[#F3F4F6] text-sm">{data.academicCredits || 4} Credits (Verified)</p>
                  </div>
                </div>

                <div className="border-t border-[#5B5F73]/15 dark:border-[#252A3D] pt-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider mb-2.5 text-[#5B5F73] dark:text-[#9499AD]">Verification & Cryptographic Details</h3>
                  <div className="space-y-2.5 text-xs bg-[#EFEDE8]/50 dark:bg-[#1A1E2E] p-4 rounded-xl border border-[#5B5F73]/15 dark:border-[#252A3D]">
                    <div className="flex justify-between items-center">
                      <span className="text-[#5B5F73] dark:text-[#9499AD] font-medium">Verification ID</span>
                      <span className="font-mono font-bold text-[#1C1C1E] dark:text-[#F3F4F6]">{data.verificationId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#5B5F73] dark:text-[#9499AD] font-medium">Blockchain Proof</span>
                      {data.blockchain?.simulated ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-mono font-semibold border border-amber-500/20">
                          MOCK / SIMULATED (Polygon PoS)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-semibold border border-emerald-500/20">
                          {data.blockchain?.status}
                        </span>
                      )}
                    </div>
                    {data.credentialHash && (
                      <div className="flex justify-between flex-col sm:flex-row sm:items-center gap-1 pt-1 border-t border-[#5B5F73]/10 dark:border-[#252A3D]">
                        <span className="text-[#5B5F73] dark:text-[#9499AD] font-medium">SHA-256 Digest</span>
                        <span className="font-mono text-[10px] break-all sm:max-w-[70%] sm:text-right text-[#5B5F73] dark:text-[#9499AD]">
                          {data.credentialHash}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {isRevoked && (
              <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-4 rounded-xl border border-red-200 dark:border-red-800/60 space-y-1 text-sm">
                <p className="font-semibold">This credential has been revoked by the issuing authority.</p>
                {data.revokedAt && (
                  <p className="text-xs opacity-90">Revocation Timestamp: {new Date(data.revokedAt).toLocaleString()}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
