import { AIProvider } from "../provider";
import { AIRequest, AIResponse } from "../types";

export class GeminiProvider implements AIProvider {
  name = "gemini";

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || "gemini-1.5-flash";

    if (!apiKey) {
      throw new Error("Missing Gemini API Key");
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = [];
    
    // System instruction mapping (Gemini 1.5 style)
    const systemInstruction = {
      role: "model", // or system, depending on specific endpoint structure, using model with instruction
      parts: [{ text: request.systemPrompt }]
    };

    if (request.history) {
      request.history.forEach(msg => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        });
      });
    }

    // Append context and user prompt
    const finalPrompt = `
CONTEXT:
${JSON.stringify(request.context || {}, null, 2)}

USER QUESTION:
${request.userPrompt}

Remember to output ONLY a valid JSON object matching the requested schema.
`;
    
    contents.push({
      role: "user",
      parts: [{ text: finalPrompt }]
    });

    const body = {
      systemInstruction,
      contents,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2 // keep it deterministic
      }
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API Error:", errText);
      throw new Error(`Gemini API Error: ${res.status}`);
    }

    const data = await res.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error("Empty response from Gemini");
    }

    try {
      const parsed = JSON.parse(responseText);
      // Validate schema
      if (!parsed.answer || !parsed.grounding || !parsed.confidence) {
        throw new Error("Invalid schema returned by Gemini");
      }
      
      return {
        answer: parsed.answer,
        grounding: parsed.grounding,
        confidence: parsed.confidence,
        referencedSkills: parsed.referencedSkills || [],
        referencedTasks: parsed.referencedTasks || [],
        referencedMilestones: parsed.referencedMilestones || [],
        recommendedActions: parsed.recommendedActions || [],
        escalationRecommended: !!parsed.escalationRecommended,
        metadata: {
          model,
          inputTokens: data.usageMetadata?.promptTokenCount,
          outputTokens: data.usageMetadata?.candidatesTokenCount
        }
      };
    } catch (err) {
      console.error("Failed to parse AI response", err);
      throw new Error("Malformed JSON from provider");
    }
  }
}
