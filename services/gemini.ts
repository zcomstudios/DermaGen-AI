import { GoogleGenAI, Type } from "@google/genai";
import { ComponentType } from "../types";

// Define a simplified schema for the AI to return. 
// We will convert this to our internal state format in the App component.
interface AIComponentDefinition {
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  color?: string;
  children?: AIComponentDefinition[];
}

export const generateLayoutFromPrompt = async (prompt: string): Promise<AIComponentDefinition | null> => {
  if (!process.env.API_KEY) {
    console.error("API Key not found");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a GMod Derma UI layout based on this description: "${prompt}".
      
      Requirements:
      1. The root element MUST be a DFrame.
      2. Provide realistic coordinates and sizes assuming an 800x600 canvas.
      3. Nest components logically (e.g., DButton inside DFrame).
      4. Use hex colors for styling if mentioned (e.g. #333333).
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: Object.values(ComponentType) },
            x: { type: Type.INTEGER },
            y: { type: Type.INTEGER },
            w: { type: Type.INTEGER },
            h: { type: Type.INTEGER },
            text: { type: Type.STRING, nullable: true },
            color: { type: Type.STRING, nullable: true },
            children: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: Object.values(ComponentType) },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    w: { type: Type.INTEGER },
                    h: { type: Type.INTEGER },
                    text: { type: Type.STRING, nullable: true },
                    color: { type: Type.STRING, nullable: true },
                    // Recursive schema definition is tricky in simple JSON schema, 
                    // so we flatten the structure instructions or just support 1 level deep for this demo effectively,
                    // but GenAI SDK supports recursive objects implicitly often. 
                    // To be safe, let's allow "children" here recursively.
                     children: { 
                        type: Type.ARRAY, 
                        items: { type: Type.OBJECT, nullable: true }, // Loose typing for recursion depth
                        nullable: true 
                     }
                }
              },
              nullable: true
            }
          },
          required: ["type", "x", "y", "w", "h"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as AIComponentDefinition;
    }
    return null;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
