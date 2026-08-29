import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { AnalyticsEngine } from "@/lib/analytics/analytics-engine";
import { UserRole } from "@/types/auth";
import { MetricValue } from "@/types/analytics";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    
    // Verify auth
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Verify role
    const userSnap = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!userSnap.exists) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    const userData = userSnap.data();
    if (userData?.role !== UserRole.FACULTY && userData?.role !== UserRole.ADMIN) {
      return new NextResponse("Forbidden: Unauthorized access to institution export", { status: 403 });
    }
    
    let targetInstitutionId = userData?.institutionId;

    if (userData?.role === UserRole.ADMIN) {
      const { searchParams } = new URL(req.url);
      const requestedInstId = searchParams.get("institutionId");
      if (requestedInstId) {
        targetInstitutionId = requestedInstId;
      }
    }

    if (!targetInstitutionId) {
      return new NextResponse("Institution ID not found for user", { status: 400 });
    }
    
    const analytics = await AnalyticsEngine.getInstitutionAnalytics(targetInstitutionId, true);
    
    // Generate CSV
    const rows: string[] = [];
    rows.push("Metric,Value,Available,Reason");
    
    const addRow = (name: string, metric: MetricValue<string | number>) => {
      const value = metric.value !== null && metric.value !== undefined ? metric.value : "";
      rows.push(`"${name}","${value}","${metric.available}","${metric.reason || ""}"`);
    };

    addRow("Student Count", analytics.studentCount);
    addRow("Active Students", analytics.activeStudents);
    addRow("Profile Completion Rate", analytics.profileCompletionRate);
    addRow("Match Ready Rate", analytics.matchReadyRate);
    addRow("Application Count", analytics.applicationCount);
    addRow("Acceptance Rate", analytics.acceptanceRate);
    addRow("Active Project Count", analytics.activeProjectCount);
    addRow("Completed Project Count", analytics.completedProjectCount);
    addRow("Completion Rate", analytics.completionRate);
    addRow("Average Fit Score", analytics.averageFitScore);
    addRow("Average Project Progress", analytics.averageProjectProgress);
    addRow("At Risk Project Count", analytics.atRiskProjectCount);
    addRow("Stalled Project Count", analytics.stalledProjectCount);
    addRow("Certificate Count", analytics.certificateCount);
    addRow("Originality Pass Rate", analytics.originalityPassRate);
    addRow("Funding Requested", analytics.fundingRequested);
    addRow("Funding Approved", analytics.fundingApproved);
    addRow("Funding Disbursed", analytics.fundingDisbursed);
    
    const csvContent = rows.join("\n");
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="institution_${targetInstitutionId}_analytics.csv"`
      }
    });

  } catch (error) {
    console.error("Institution Export Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
