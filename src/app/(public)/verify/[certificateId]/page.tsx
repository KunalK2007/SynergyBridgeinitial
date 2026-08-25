"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckCircle, XCircle, HelpCircle, FileText, Link, Calendar } from "lucide-react";

interface VerifyResponse {
  valid: boolean;
  status: string;
  verificationId?: string;
  projectTitle?: string;
  problemTitle?: string;
  studentName?: string;
  institution?: string;
  issuedAt?: string;
  credentialHash?: string;
  blockchain?: {
    status: string;
    simulated: boolean;
  };
  revokedAt?: string;
}

export default function PublicVerificationPage() {
  const { certificateId } = useParams();
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!certificateId) return;
    
    fetch(`/api/certificates/${certificateId}`)
      .then(async res => {
        if (!res.ok) {
          if (res.status === 404) return res.json();
          if (res.status === 403) throw new Error("Permission denied to verify certificate");
          if (res.status === 400) throw new Error("Invalid certificate ID format");
          const text = await res.text().catch(() => "");
          throw new Error(`Query failure: Server returned ${res.status}`);
        }
        return res.json();
      })
      .then((json: VerifyResponse) => {
        if (json.valid === false && json.status === "NOT_FOUND") {
          setData(null);
        } else {
          setData(json);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [certificateId]);

  if (loading) return <div className="p-8 text-center">Verifying certificate...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!data) return <div className="p-8 text-center text-muted-foreground">Certificate not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              {data.status === "VERIFIED" || data.status === "ISSUED" ? (
                <CheckCircle className="h-16 w-16 text-green-500" />
              ) : data.status === "REVOKED" ? (
                <XCircle className="h-16 w-16 text-red-500" />
              ) : (
                <HelpCircle className="h-16 w-16 text-slate-400" />
              )}
            </div>
            <CardTitle className="text-3xl font-bold">
              {data.status === "VERIFIED" || data.status === "ISSUED" 
                ? "Verified Credential" 
                : data.status === "REVOKED" 
                ? "Revoked Credential" 
                : "Credential Not Found"}
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Official Academic Verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(data.status === "VERIFIED" || data.status === "ISSUED") && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <FileText className="w-4 h-4" /> Recipient
                    </p>
                    <p className="font-semibold">{data.studentName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <FileText className="w-4 h-4" /> Institution
                    </p>
                    <p className="font-semibold">{data.institution}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <FileText className="w-4 h-4" /> Project
                    </p>
                    <p className="font-semibold">{data.projectTitle}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> Issued
                    </p>
                    <p className="font-semibold">{new Date(data.issuedAt!).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-sm mb-2 text-muted-foreground">Technical Details</h3>
                  <div className="space-y-2 text-sm bg-slate-50 p-4 rounded-md border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verification ID</span>
                      <span className="font-mono">{data.verificationId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Blockchain</span>
                      {data.blockchain?.simulated ? (
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-xs font-mono">MOCK / SIMULATED</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded border border-slate-300 text-slate-800 text-xs">{data.blockchain?.status}</span>
                      )}
                    </div>
                    <div className="flex justify-between flex-col sm:flex-row sm:items-center">
                      <span className="text-muted-foreground">Hash</span>
                      <span className="font-mono text-xs break-all sm:max-w-[70%] sm:text-right text-slate-500">
                        {data.credentialHash}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {data.status === "REVOKED" && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
                <p>This credential has been revoked by the issuer.</p>
                {data.revokedAt && (
                  <p className="text-sm mt-1 opacity-80">Revoked on: {new Date(data.revokedAt).toLocaleDateString()}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
