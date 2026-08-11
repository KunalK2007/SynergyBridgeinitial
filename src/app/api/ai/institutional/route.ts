import { NextRequest, NextResponse } from "next/server";
import { generateInstitutionalInsight } from "@/lib/ai/institutional-service";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { UserRole } from "@/types/auth";
import { InstitutionalAIRequest } from "@/types/ai-institutional";

import { z } from "zod";

const aiRequestSchema = z.object({
  question: z.string().min(3).max(500),
  conversationId: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const role = decodedToken.role as UserRole;

    if (role !== UserRole.ADMIN && role !== UserRole.FACULTY && role !== UserRole.INCUBATION) {
      return NextResponse.json({ error: "Permission Denied" }, { status: 403 });
    }

    // Always fetch the institutionId from the server-side profile to prevent tampering
    let institutionId = decodedToken.institutionId as string;
    
    if (!institutionId) {
      // Fallback to fetching profile if not in token
      const profileSnap = await adminDb.collection("users").doc(userId).get();
      if (!profileSnap.exists) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      institutionId = profileSnap.data()?.institutionId;
    }

    if (!institutionId && role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "No institution associated with user" }, { status: 403 });
    }

    const rawBody = await req.json();
    const parseResult = aiRequestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid request payload", details: parseResult.error.format() }, { status: 400 });
    }
    
    const body: InstitutionalAIRequest = parseResult.data;

    // Call the AI Service
    const insight = await generateInstitutionalInsight(
      userId,
      role,
      institutionId,
      body
    );

    return NextResponse.json(insight);

  } catch (error) {
    console.error("Institutional AI API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
