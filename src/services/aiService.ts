import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    // Priority order for API key:
    // 1. process.env.GEMINI_API_KEY / GOOGLE_API_KEY (Defined by Vite)
    // 2. import.meta.env.VITE_GEMINI_API_KEY / VITE_GOOGLE_API_KEY
    const apiKey = 
      process.env.GEMINI_API_KEY || 
      process.env.GOOGLE_API_KEY ||
      (import.meta as any).env.VITE_GEMINI_API_KEY || 
      (import.meta as any).env.VITE_GOOGLE_API_KEY ||
      (import.meta as any).env.GEMINI_API_KEY ||
      (import.meta as any).env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.warn("API Key not found in environment.");
      throw new Error("API Key is missing. Please add 'GOOGLE_API_KEY' to the 'Secrets' panel in AI Studio settings.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function matchVolunteerToTask(issue: any, volunteers: any[]) {
  try {
    const ai = getAI();
    const prompt = `
      Task Details:
      Title: ${issue.title}
      Description: ${issue.description}
      Severity: ${issue.severity}
      Category: ${issue.category}
      Location: ${issue.location}
      Status: ${issue.status}
      
      Available Volunteers:
      ${volunteers
        .filter(v => v.status === "Available")
        .map(v => `- ID ${v.id}: ${v.fullName}, Skills: ${v.skills?.join(", ")}, Location: ${v.location}`)
        .join("\n")}
      
      Recommend the best 3 available volunteers for this task based on:
      1. Skillset match with the task type and description.
      2. Geographic proximity (if location is mentioned).
      
      Return the result as a JSON array of objects with exactly these keys: 'id', 'name', 'reason' (very short description of why), and 'score' (0-100).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
          responseMimeType: "application/json"
      }
    });

    const results = JSON.parse(response.text || "[]");
    return results;
  } catch (error: any) {
    console.error("AI Match Error:", error);
    throw error; // Throw so the UI can handle the error message
  }
}

export async function summarizeNeeds(issues: any[]) {
  try {
    const ai = getAI();
    const prompt = `
      Summarize the biggest community needs based on these reported issues:
      ${issues.map(i => `- ${i.title} (${i.severity}, ${i.location})`).join("\n")}
      
      Identify themes and urgent areas. Keep it concise for a dashboard view.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    return response.text;
  } catch (error: any) {
    console.error("AI Summary Error:", error);
    return "AI generation failed. Please check your API configuration.";
  }
}
