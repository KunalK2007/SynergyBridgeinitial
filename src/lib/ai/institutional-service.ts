import { aiService } from "./service";
import { INSTITUTIONAL_SYSTEM_PROMPT } from "./prompts";
import { buildInstitutionalAIContext } from "./institutional-context";
import { validateInstitutionalAIOutput, createSafeFallback } from "./institutional-output-validator";
import { InstitutionalAIRequest, InstitutionalAIResponse } from "@/types/ai-institutional";
import { adminDb } from "@/lib/firebase/admin";
import { UserRole } from "@/types/auth";

export async function generateInstitutionalInsight(
  userId: string,
  userRole: UserRole,
  institutionId: string,
  request: InstitutionalAIRequest
): Promise<InstitutionalAIResponse> {
  try {
    // 1. Authorization: Only allow ADMIN or INSTITUTION_COORDINATOR for this feature.
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.FACULTY) {
      return createSafeFallback("PERMISSION_DENIED");
    }

    // 2. Build safe context (strips PII, asserts cohort sizes)
    const context = await buildInstitutionalAIContext(institutionId, request.timeRange || "ALL_TIME");

    // 3. Prepare Prompt & Context
    const systemPrompt = INSTITUTIONAL_SYSTEM_PROMPT;
    const userPrompt = request.question;

    let history: { role: "user" | "model"; content: string }[] = [];
    
    // If conversationId is provided, fetch history safely
    if (request.conversationId) {
      const convRef = adminDb.collection("institutionalAIConversations").doc(request.conversationId);
      const convSnap = await convRef.get();
      
      if (convSnap.exists) {
        const convData = convSnap.data();
        if (convData?.institutionId !== institutionId) {
          // Prevent cross-institution conversation access
          return createSafeFallback("PERMISSION_DENIED");
        }
        
        const messagesSnap = await convRef.collection("messages").orderBy("timestamp", "asc").get();
        history = messagesSnap.docs.map(d => {
          const m = d.data();
          return { role: m.role === "user" ? "user" : "model", content: m.content };
        });
      }
    }

    // 4. Generate AI response via existing provider
    const rawResponse = await aiService.generateInstitutionalResponse({
      systemPrompt,
      userPrompt,
      history,
      context: { 
        schemaVersion: context.schemaVersion,
        metrics: context.metrics,
        trends: context.trends
      }
    });

    // 5. Validate and Ground Response
    const validatedResponse = validateInstitutionalAIOutput(rawResponse, context);

    // 6. Record usage (Rate limiting and tracking)
    await adminDb.collection("aiUsageRecords").add({
      userId,
      institutionId,
      requestType: "INSTITUTIONAL_INSIGHT",
      timestamp: new Date().toISOString(),
      provider: aiService.providerName,
      success: validatedResponse.groundingStatus !== "INSUFFICIENT_DATA",
      confidence: validatedResponse.confidence,
      analysisType: request.analysisType || "STRATEGIC"
    });

    // 7. Save conversation history if applicable
    if (request.conversationId) {
      const convRef = adminDb.collection("institutionalAIConversations").doc(request.conversationId);
      const timestamp = new Date().toISOString();
      
      const batch = adminDb.batch();
      
      // User message
      batch.set(convRef.collection("messages").doc(), {
        role: "user",
        content: request.question,
        timestamp,
        analysisType: request.analysisType
      });
      
      // AI message
      batch.set(convRef.collection("messages").doc(), {
        role: "ai",
        content: JSON.stringify(validatedResponse),
        timestamp: new Date().toISOString(),
        groundingStatus: validatedResponse.groundingStatus,
        confidence: validatedResponse.confidence
      });
      
      batch.update(convRef, { updatedAt: timestamp });
      await batch.commit();
    }

    return validatedResponse;
  } catch (error) {
    console.error("Error in generateInstitutionalInsight:", error);
    return createSafeFallback("An unexpected error occurred while generating insights.");
  }
}
