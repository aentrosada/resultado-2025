import { GoogleGenAI, Type } from "@google/genai";
import { ReportCardData } from "../types";

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeReportCard = async (base64Image: string, mimeType: string): Promise<ReportCardData> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Analise este documento (imagem ou PDF) de um boletim escolar do Encceja.
    
    Extraia as notas das seguintes áreas de conhecimento, se estiverem visíveis:
    1. Ciências da Natureza
    2. Ciências Humanas
    3. Linguagens
    4. Matemática
    5. Redação

    Tente também extrair o nome do participante se visível.
    
    Retorne NULL se a nota não estiver visível ou legível.
    As notas numéricas geralmente vão de 60 a 180, e a redação de 0 a 10.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            naturalSciences: { type: Type.NUMBER, description: "Nota de Ciências da Natureza e suas Tecnologias" },
            humanSciences: { type: Type.NUMBER, description: "Nota de Ciências Humanas e suas Tecnologias" },
            languages: { type: Type.NUMBER, description: "Nota de Linguagens, Códigos e suas Tecnologias" },
            mathematics: { type: Type.NUMBER, description: "Nota de Matemática e suas Tecnologias" },
            essay: { type: Type.NUMBER, description: "Nota da Redação" },
            studentName: { type: Type.STRING, description: "Nome do estudante, se visível" }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(text);
    
    // Simple logic to determine if "passing" based on typical Encceja rules (100+ in subjects, 5+ in essay)
    const isPassing = (
      (data.naturalSciences === null || data.naturalSciences >= 100) &&
      (data.humanSciences === null || data.humanSciences >= 100) &&
      (data.languages === null || data.languages >= 100) &&
      (data.mathematics === null || data.mathematics >= 100) &&
      (data.essay === null || data.essay >= 5)
    );

    return {
      ...data,
      isPassing
    };

  } catch (error) {
    console.error("Error analyzing document:", error);
    throw error;
  }
};