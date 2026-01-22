import { GoogleGenAI, Type } from "@google/genai";
import { AIProfileResponse } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateIdCardProfile = async (
  keyword: string
): Promise<AIProfileResponse | null> => {
  try {
    const model = "gemini-3-flash-preview";
    
    const response = await ai.models.generateContent({
      model: model,
      contents: `Generate a fictional but professional employee profile for an ID card based on the keyword/industry: "${keyword}". 
      Include a name, a job title, a short professional tagline, a department, and a suggested color theme (array of 2 hex codes).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            role: { type: Type.STRING },
            tagline: { type: Type.STRING },
            department: { type: Type.STRING },
            colorTheme: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["fullName", "role", "tagline", "department", "colorTheme"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIProfileResponse;
    }
    return null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const analyzeDesign = async (elementCount: number, hasQr: boolean): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `I am designing an ID card. It currently has ${elementCount} elements. QR Code present: ${hasQr}. Give me a 1-sentence design tip to improve balance or aesthetics.`
        });
        return response.text || "Keep the design simple and readable.";
    } catch (e) {
        return "Ensure high contrast for better readability.";
    }
}