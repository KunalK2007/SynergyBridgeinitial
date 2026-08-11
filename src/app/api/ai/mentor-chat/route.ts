import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { aiService } from "@/lib/ai/service";
import { MENTOR_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { checkRateLimit, logAIUsage } from "@/lib/ai/rate-limit";
import { buildProjectContext } from "@/lib/utils/project-context";
import { generateLearningPath } from "@/lib/utils/learning-path";
import { Project } from "@/types/project";
import { Problem } from "@/types/problem";
import { StudentProfile } from "@/types/profile";
import { Task } from "@/types/task";
import { Milestone } from "@/types/milestone";
import { MentorFeedback } from "@/types/mentor-feedback";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const studentId = decodedToken.uid;

    const body = await req.json();
    const { projectId, userPrompt, history } = body;

    if (!projectId || !userPrompt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Check Rate Limits
    const isAllowed = await checkRateLimit(studentId);
    if (!isAllowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // 3. Verify Project Access and Participation
    const projectSnap = await adminDb.collection("projects").doc(projectId).get();
    if (!projectSnap.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const projectData = projectSnap.data() as Project;
    
    if (!projectData.studentIds.includes(studentId)) {
      return NextResponse.json({ error: "Forbidden: Not a participant" }, { status: 403 });
    }

    // 4. Gather Deterministic Context
    const [problemSnap, studentSnap, tasksSnap, milestonesSnap, feedbackSnap] = await Promise.all([
      adminDb.collection("problems").doc(projectData.problemId).get(),
      adminDb.collection("students").doc(studentId).get(), // Assuming individual profile collection or "users"
      adminDb.collection("tasks").where("projectId", "==", projectId).get(),
      adminDb.collection("milestones").where("projectId", "==", projectId).get(),
      adminDb.collection("mentorFeedback").where("projectId", "==", projectId).get()
    ]);

    const problem = problemSnap.data() as Problem;
    // Fallback if student profiles are stored in "users"
    const studentData = studentSnap.exists ? studentSnap.data() : (await adminDb.collection("users").doc(studentId).get()).data();
    const studentProfile = studentData as StudentProfile;
    
    const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Task);
    const milestones = milestonesSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Milestone);
    const feedback = feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() }) as MentorFeedback);

    // Build context
    const context = buildProjectContext(
      projectData,
      problem,
      null, // team is optional for MVP context
      [studentProfile],
      tasks,
      milestones,
      feedback,
      projectData.progress || 0,
      "UNKNOWN" // Could recalculate health if needed, but passing generic for now
    );

    // Generate Learning Path deterministic result
    const learningPath = generateLearningPath(
      studentId,
      projectId,
      studentProfile.skills || [],
      problem.skills || [],
      tasks,
      milestones
    );

    const fullContext = {
      ...context,
      learningPath
    };

    // 5. Invoke AI Provider
    const aiResponse = await aiService.generateMentorResponse({
      systemPrompt: MENTOR_SYSTEM_PROMPT,
      userPrompt,
      history,
      context: fullContext
    });

    // 6. Log Usage
    await logAIUsage(
      studentId,
      projectId,
      aiService.providerName as "gemini" | "mock" | "openai" | "anthropic",
      aiResponse.metadata?.model || "unknown",
      "CHAT",
      true,
      undefined,
      aiResponse.metadata?.inputTokens,
      aiResponse.metadata?.outputTokens
    );

    return NextResponse.json(aiResponse);
  } catch (error: unknown) {
    console.error("AI Mentor Endpoint Error:", error);
    
    // Log failed usage
    // We try to extract studentId from token if possible, else generic log
    
    return NextResponse.json({ 
      error: "An internal error occurred while processing the request." 
    }, { status: 500 });
  }
}
