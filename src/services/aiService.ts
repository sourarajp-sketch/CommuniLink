import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function matchVolunteerToTask(issue: any, volunteers: any[]) {
  try {
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
  } catch (error) {
    console.error("AI Match Error:", error);
    return [];
  }
}

export async function summarizeNeeds(issues: any[]) {
  try {
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
  } catch (error) {
    console.error("AI Summary Error:", error);
    return "Failed to generate summary.";
  }
}
