/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { problemSchema, draftProblemSchema } from "@/lib/validation/problem";
import { ProblemStatus, VerificationStatus } from "@/types/problem";
import { UserRole } from "@/types/auth";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing auth token" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Unauthorized: Invalid auth token" }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User profile not found in database" }, { status: 404 });
    }

    const userData = userDoc.data()!;
    const userRole = (userData.role as UserRole) || UserRole.STUDENT;

    const body = await req.json();
    const action = body.action === "PUBLISH" ? "PUBLISH" : "DRAFT";
    const existingProblemId = body.problemId;

    let parsedData: any;
    let finalStatus: ProblemStatus;
    let finalVerification: VerificationStatus;
    let finalVisibility: "PUBLIC" | "PRIVATE";
    let message = "";

    if (action === "PUBLISH") {
      const validation = problemSchema.safeParse(body.data);
      if (!validation.success) {
        return NextResponse.json({
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        }, { status: 422 });
      }
      parsedData = validation.data;

      // Role authorization logic
      if (userRole === UserRole.STUDENT) {
        // Students submit proposals for review
        finalStatus = ProblemStatus.DRAFT;
        finalVerification = VerificationStatus.PENDING_REVIEW;
        finalVisibility = "PRIVATE";
        message = "Problem proposal submitted for review by faculty/industry!";
      } else {
        // Authorized creators publish directly
        finalStatus = ProblemStatus.PUBLISHED;
        finalVerification = userRole === UserRole.ADMIN ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED;
        finalVisibility = "PUBLIC";
        message = "Problem published successfully to the repository!";
      }
    } else {
      // Draft action
      const validation = draftProblemSchema.safeParse(body.data);
      parsedData = validation.success ? validation.data : body.data;
      finalStatus = ProblemStatus.DRAFT;
      finalVerification = VerificationStatus.UNVERIFIED;
      finalVisibility = "PRIVATE";
      message = "Draft saved successfully!";
    }

    const now = Date.now();
    const problemRef = existingProblemId 
      ? adminDb.collection("problems").doc(existingProblemId)
      : adminDb.collection("problems").doc();

    const problemId = problemRef.id;

    // Check if updating existing problem that user owns
    let createdAt = now;
    if (existingProblemId) {
      const existingSnap = await problemRef.get();
      if (existingSnap.exists) {
        const exData = existingSnap.data()!;
        if (exData.posterId !== uid && userRole !== UserRole.ADMIN) {
          return NextResponse.json({ error: "Forbidden: You cannot modify this problem" }, { status: 403 });
        }
        createdAt = exData.createdAt || now;
      }
    }

    const problemDoc = {
      ...parsedData,
      id: problemId,
      status: finalStatus,
      verificationStatus: finalVerification,
      visibility: finalVisibility,
      posterId: uid,
      posterRole: userRole,
      organizationName: userData.displayName || decodedToken.email?.split("@")[0] || "Organization",
      institutionId: userData.institutionId || null,
      createdAt,
      updatedAt: now,
    };

    await problemRef.set(problemDoc, { merge: true });

    return NextResponse.json({
      success: true,
      problemId,
      status: finalStatus,
      verificationStatus: finalVerification,
      message,
      problem: problemDoc,
    });
  } catch (error: any) {
    console.error("Error creating/updating problem:", error);
    return NextResponse.json({
      error: "Internal Server Error",
      details: error.message,
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const snap = await adminDb
      .collection("problems")
      .where("posterId", "==", uid)
      .get();

    const problems = snap.docs.map(doc => doc.data());
    problems.sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0));

    return NextResponse.json({
      success: true,
      problems,
    });
  } catch (error: any) {
    console.error("Error fetching user problems:", error);
    return NextResponse.json({
      error: "Internal Server Error",
      details: error.message,
    }, { status: 500 });
  }
}
