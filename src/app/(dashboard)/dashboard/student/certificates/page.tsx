"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Certificate } from "@/types/certificate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthContext";
import { ExternalLink, ShieldCheck, Download, AlertCircle } from "lucide-react";
import Link from "next/link";

import { SYNTHETIC_DEMO_CERTIFICATES } from "@/lib/constants/demo-certificates";

export default function StudentCertificatesPage() {
  const { currentUser: user, loading: loadingAuth, firebaseUser } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = (p: unknown) => console.log(p);

  useEffect(() => {
    if (!user) return;
    const fetchCerts = async () => {
      try {
        const q = query(collection(db, "certificates"), where("studentId", "==", user.uid));
        const snap = await getDocs(q);
        const certs = snap.docs.map(d => d.data() as Certificate);
        if (certs.length > 0) {
          setCertificates(certs);
        } else {
          // If no certificates found in Firestore, provide the canonical synthetic demo certificates for demo students
          setCertificates(
            SYNTHETIC_DEMO_CERTIFICATES.map(c => ({
              ...c,
              studentId: user.uid,
              studentName: user.displayName || c.studentName
            }))
          );
        }
      } catch (err) {
        console.warn("Error fetching certificates from Firestore, using demo credentials:", err);
        setCertificates(
          SYNTHETIC_DEMO_CERTIFICATES.map(c => ({
            ...c,
            studentId: user.uid,
            studentName: user.displayName || c.studentName
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    fetchCerts();
  }, [user]);

  const handleSyncDigilocker = async (certId: string) => {
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch("/api/integrations/digilocker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ certificateId: certId })
      });
      if (!res.ok) throw new Error("Failed to sync");
      const data = await res.json();
      
      // toast({
      //   title: "DigiLocker Sync Simulated",
      //   description: `Status: ${data.status}. This was a mock operation.`,
      // });
      alert(`DigiLocker Sync Simulated. Status: ${data.status}`);
      // Refresh
      window.location.reload();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive"
      });
    }
  };

  const handleSyncABC = async (certId: string) => {
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch("/api/integrations/abc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ certificateId: certId, credits: 4 })
      });
      if (!res.ok) throw new Error("Failed to sync");
      const data = await res.json();
      
      // toast({
      //   title: "ABC Sync Simulated",
      //   description: `Status: ${data.status}. This was a mock operation.`,
      // });
      alert(`ABC Sync Simulated. Status: ${data.status}`);
      // Refresh
      window.location.reload();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive"
      });
    }
  };

  if (loadingAuth || loading) return <div className="p-8">Loading certificates...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Credentials</h2>
        <p className="text-muted-foreground">View and manage your verified academic outcomes.</p>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            You don&apos;t have any verified certificates yet. Complete projects to earn them!
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map(cert => (
            <Card key={cert.id} className={cert.status === "REVOKED" ? "opacity-70" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${cert.status === "ISSUED" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                    {cert.status}
                  </span>
                </div>
                <CardTitle className="mt-4">{cert.projectTitle}</CardTitle>
                <CardDescription>Issued: {new Date(cert.issuedAt!).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verification ID</span>
                    <span className="font-mono">{cert.verificationId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DigiLocker</span>
                    <span className="font-semibold">{cert.digiLockerStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ABC (Credits)</span>
                    <span className="font-semibold">{cert.abcStatus}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 border-t pt-4">
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1" disabled={cert.status === "REVOKED"}>
                    <Link href={`/verify/${cert.verificationId}`} target="_blank">
                      <ExternalLink className="w-4 h-4 mr-2" /> Verify URL
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex-1" disabled={cert.status === "REVOKED"}>
                    <Download className="w-4 h-4 mr-2" /> PDF
                  </Button>
                </div>
                {cert.status === "ISSUED" && (
                  <div className="flex gap-2 w-full">
                    <Button 
                      variant="default" 
                      className="flex-1 text-xs" 
                      disabled={cert.digiLockerStatus === "SYNCED" || cert.digiLockerStatus === "MOCK"}
                      onClick={() => handleSyncDigilocker(cert.id)}
                    >
                      Sync DigiLocker
                    </Button>
                    <Button 
                      variant="default" 
                      className="flex-1 text-xs" 
                      disabled={cert.abcStatus === "SYNCED" || cert.abcStatus === "MOCK"}
                      onClick={() => handleSyncABC(cert.id)}
                    >
                      Submit ABC
                    </Button>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" /> External sync is simulated for MVP
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
