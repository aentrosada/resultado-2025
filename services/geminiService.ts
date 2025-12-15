import { GoogleGenAI, Type } from "@google/genai";
import { ReportCardData } from "../types";

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 🔒 Função para bloquear nome de pessoa como instituição
const looksLikePersonName = (text?: string): boolean => {
  if (!text) return false;

  const words = text.trim().split(/\s+/);

  // Nome de pessoa normalmente tem entre 2 e 4 palavras
  if (words.length >= 2 && words.length <= 4) {
    return words.every(
      word => word[0] === word[0]?.toUpperCase()
    );
  }

  return false;
};

export const analyzeReportCard = async (
  base64Image: string,
  mimeType: string
): Promise<ReportCardData> => {
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

⚠️ ATENÇÃO IMPORTANTE:
- NÃO considere nomes de pessoas como instituição certificadora.
- Instituição certificadora é SOMENTE um órgão oficial, como:
  - INEP
  - Secretaria Estadual de Educação
  - Secretaria Municipal de Educação
  - Instituto Federal
  - Governo do Estado
  - Prefeitura

- Se o texto parecer nome de pessoa física (exemplo: dois a quatro nomes próprios),
  retorne NULL em "certifyingInstitution".

Extraia o nome da instituição certificadora SOMENTE se for claramente um órgão público
ou instituição educacional oficial.

Retorne NULL se a informação não estiver clara ou legível.

As notas numéricas geralmente vão de 60 a 180, e a redação de 0 a 10.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
            naturalSciences: {
              type: Type.NUMBER,
              description: "Nota de Ciências da Natureza e suas Tecnologias"
            },
            humanSciences: {
              type: Type.NUMBER,
              description: "Nota de Ciências Humanas e suas Tecnologias"
            },
            languages: {
              type: Type.NUMBER,
              description: "Nota de Linguagens, Códigos e suas Tecnologias"
            },
            mathematics: {
              type: Type.NUMBER,
              description: "Nota de Matemática e suas Tecnologias"
            },
            essay: {
              type: Type.NUMBER,
              description: "Nota da Redação"
            },
            studentName: {
              type: Type.STRING,
              description: "Nome do estudante, se visível"
            },
            certifyingInstitution: {
              type: Type.STRING,
              description:
                "Órgão oficial certificador (INEP, Secretaria de Educação, Instituto Federal). NÃO é nome de pessoa."
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(text);

    // 🔒 Validação final para impedir nome de pessoa como instituição
    if (looksLikePersonName(data.certifyingInstitution)) {
      data.certifyingInstitution = null;
    }

    // Mapeia instituição para histórico (caso sua UI use esse campo)
    if (data.certifyingInstitution) {
      data.history = data.certifyingInstitution;
    }

    // Regra simples de aprovação Encceja
    const isPassing =
      (data.naturalSciences === null || data.naturalSciences >= 100) &&
      (data.humanSciences === null || data.humanSciences >= 100) &&
      (data.languages === null || data.languages >= 100) &&
      (data.mathematics === null || data.mathematics >= 100) &&
      (data.essay === null || data.essay >= 5);

    return {
      ...data,
      isPassing
    };
  } catch (error) {
    console.error("Error analyzing document:", error);
    throw error;
  }
};
