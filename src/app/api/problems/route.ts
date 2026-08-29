/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { problemSchema, draftProblemSchema } from "@/lib/validation/problem";
import { ProblemStatus, VerificationStatus } from "@/types/problem";
import { UserRole } from "@/types/auth";

export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .map((item) => sanitizeForFirestore(item))
      .filter((item) => item !== undefined) as unknown as T;
  }
  if (typeof data === "object" && !(data instanceof Date)) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirestore(value);
      }
    }
    return result as T;
  }
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ 
        error: "Unauthorized: Missing authentication token", 
        code: "UNAUTHENTICATED" 
      }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken: any;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err: any) {
      console.warn("[POST /api/problems] verifyIdToken failed:", err?.message);
      return NextResponse.json({ 
        error: "Unauthorized: Invalid authentication token", 
        code: "UNAUTHENTICATED" 
      }, { status: 401 });
    }

    const uid = decodedToken.uid;
    let userRole = UserRole.STUDENT;
    let displayName = decodedToken.name || decodedToken.email?.split("@")[0] || "Innovator";
    let institutionId: string | null = null;

    try {
      const userDoc = await adminDb.collection("users").doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data()!;
        userRole = (userData.role as UserRole) || UserRole.STUDENT;
        displayName = userData.displayName || displayName;
        institutionId = userData.institutionId || null;
      }
    } catch (err: any) {
      console.warn("[POST /api/problems] Could not fetch userDoc from adminDb, using token metadata:", err?.message);
    }

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
          code: "VALIDATION_ERROR",
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
      try {
        const existingSnap = await problemRef.get();
        if (existingSnap.exists) {
          const exData = existingSnap.data()!;
          if (exData.posterId && exData.posterId !== uid && userRole !== UserRole.ADMIN) {
            return NextResponse.json({ 
              error: "Forbidden: You cannot modify this problem", 
              code: "FORBIDDEN" 
            }, { status: 403 });
          }
          createdAt = exData.createdAt || now;
        }
      } catch (err: any) {
        console.warn("[POST /api/problems] Could not verify existing problem snap:", err?.message);
      }
    }

    const rawProblemDoc = {
      ...parsedData,
      id: problemId,
      status: finalStatus,
      verificationStatus: finalVerification,
      visibility: finalVisibility,
      posterId: uid,
      posterRole: userRole,
      organizationName: displayName,
      institutionId,
      createdAt,
      updatedAt: now,
    };

    const problemDoc = sanitizeForFirestore(rawProblemDoc);

    try {
      await problemRef.set(problemDoc, { merge: true });
    } catch (writeErr: any) {
      console.error("[POST /api/problems] Firestore admin write failed:", writeErr?.message);
      if (!isFirebaseAdminConfigured()) {
        return NextResponse.json({
          error: "Firebase Admin credentials not configured on server",
          code: "FIREBASE_CONFIGURATION_ERROR",
          details: "Server-side service account is missing or invalid. Client-side persistence fallback available.",
        }, { status: 500 });
      }
      return NextResponse.json({
        error: "Failed to persist problem record to database",
        code: "FIRESTORE_WRITE_ERROR",
        details: writeErr?.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      problemId,
      status: finalStatus,
      verificationStatus: finalVerification,
      message,
      problem: problemDoc,
    });
  } catch (error: any) {
    console.error("[POST /api/problems] Unexpected internal error:", error?.message);
    return NextResponse.json({
      error: "Internal Server Error",
      code: "INTERNAL_ERROR",
      details: error.message,
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        code: "UNAUTHENTICATED" 
      }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken: any;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ 
        error: "Unauthorized: Invalid token", 
        code: "UNAUTHENTICATED" 
      }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const snap = await adminDb
      .collection("problems")
      .where("posterId", "==", uid)
      .get();

    const problems = snap.docs.map(doc => doc.data());

    return NextResponse.json({
      success: true,
      problems,
    });
  } catch (error: any) {
    console.error("[GET /api/problems] Error fetching user problems:", error?.message);
    return NextResponse.json({
      error: "Internal Server Error",
      code: "INTERNAL_ERROR",
      details: error.message,
    }, { status: 500 });
  }
}
