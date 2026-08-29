import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { originalityService } from "@/lib/server/originality-service";
import { z } from "zod";
import { canAccessProject } from "@/lib/server/auth-helpers";
import { OriginalityAssessmentInput } from "@/lib/utils/originality";
import { Project } from "@/types/project";
// Removed unused imports

const assessSchema = z.object({
  projectId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const body = await req.json();
    const parsed = assessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data", details: parsed.error }, { status: 422 });
    }

    const { projectId } = parsed.data;

    const userSnap = await adminDb.collection("users").doc(decodedToken.uid).get();
    const userRole = userSnap.data()?.role;

    const hasAccess = await canAccessProject(decodedToken.uid, userRole, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized access to project" }, { status: 403 });
    }

    const projectSnap = await adminDb.collection("projects").doc(projectId).get();
    if (!projectSnap.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const project = projectSnap.data() as Project;

    // Fetch dependencies
    const tasksSnap = await adminDb.collection("projects").doc(projectId).collection("tasks").get();
    const milestonesSnap = await adminDb.collection("projects").doc(projectId).collection("milestones").get();

    const input: OriginalityAssessmentInput = {
      projectId,
      projectMetadata: {
        descriptionLength: (project as unknown as Record<string, unknown>).description ? ((project as unknown as Record<string, unknown>).description as string).length : 0,
        tasksCount: tasksSnap.size,
        milestonesCount: milestonesSnap.size,
        hasRepositoryUrl: !!(project as unknown as Record<string, unknown>).repositoryUrl,
      },
      peerReviewSignals: {
        reviewsConsidered: 0, // Mocked for now
        originalityConcerns: 0,
      },
      assessorId: decodedToken.uid,
    };

    const report = await originalityService.assessOriginality(input);
    
    return NextResponse.json({ report });
  } catch (error: unknown) {
    console.error("Originality Assess Error:", error);
    return NextResponse.json({ error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) || "Internal server error" }, { status: 500 });
  }
}
