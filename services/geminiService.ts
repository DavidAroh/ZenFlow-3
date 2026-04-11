
import { GoogleGenAI, Type } from "@google/genai";
import { Task, WellnessEntry, WorkLog } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Fix: Initialize GoogleGenAI with named parameter and direct process.env.GEMINI_API_KEY reference
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async generateDailyInsight(tasks: Task[], wellness: WellnessEntry[], logs: WorkLog[]) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on the following user data, provide a concise wellness insight. 
        Tasks: ${JSON.stringify(tasks.map(t => ({ title: t.title, stress: t.stress })))}
        Recent Logs: ${JSON.stringify(logs.slice(0, 3))}
        Recent Wellness: ${JSON.stringify(wellness.slice(0, 3))}
        
        Provide a JSON response with 'title', 'content', and 'type' (one of: warning, info, tip).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              type: { type: Type.STRING }
            },
            required: ['title', 'content', 'type']
          }
        }
      });

      // Fix: Access response.text as a property directly
      const text = response.text;
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error("AI Insight Error:", error);
      return {
        title: "Stay Mindful",
        content: "Take regular breaks to maintain your focus and energy levels throughout the day.",
        type: "info"
      };
    }
  }

  async getFocusRecommendation(currentTask: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `I am currently working on: "${currentTask}". Give me one very short focus tip (max 20 words).`,
      });
      // Fix: Access response.text as a property directly
      return response.text;
    } catch (e) {
      return "Focus on one small sub-task at a time to reduce cognitive load.";
    }
  }

  async analyzeTasks(tasks: Task[], wellness: WellnessEntry[]): Promise<string> {
    try {
      const latestWellness = wellness.length > 0 ? wellness[wellness.length - 1] : null;
      const prompt = `
        Analyze these tasks and suggest the best one to start with based on the user's current state.
        Tasks: ${JSON.stringify(tasks.map(t => ({ title: t.title, stress: t.stress, status: t.status })))}
        Current Wellness: ${latestWellness ? `Mood: ${latestWellness.mood}/5, Energy: ${latestWellness.energy}/5` : 'Unknown'}
        
        Provide a concise 2-sentence recommendation.
      `;
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text || "Start with your highest priority task.";
    } catch (error) {
      console.error("Task analysis error:", error);
      return "Focus on your most urgent task first.";
    }
  }
}

export const gemini = new GeminiService();
