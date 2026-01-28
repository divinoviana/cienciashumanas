
import { GoogleGenAI, Type } from "@google/genai";

export interface CorrectionResult {
  question: string;
  studentAnswer: string;
  isCorrect: boolean;
  score: number; 
  feedback: string;
}

export interface AIResponse {
  generalComment: string;
  corrections: CorrectionResult[];
}

export interface EvaluationQuestion {
  id: number;
  textFragment: string;
  questionText: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
    e: string;
  };
  correctOption: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  explanation: string;
}

export interface GeneratedEvaluation {
  subject: string;
  grade: string;
  bimester: string;
  questions: EvaluationQuestion[];
}

/**
 * Inicializa a IA usando a variável injetada pelo Vite a partir do Vercel.
 */
const getAIClient = () => {
  // Fix: Access process.env.API_KEY directly for checking availability
  const apiKey = process.env.API_KEY;
  
  // Verificação de segurança para o desenvolvedor
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("Erro de Configuração: A chave 'API_KEY' não foi encontrada nas variáveis de ambiente do Vercel.");
  }
  
  // Fix: Always use process.env.API_KEY directly in initialization as per guidelines
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateBimonthlyEvaluation = async (
  subjectName: string,
  grade: string,
  bimester: string,
  topics: string[]
): Promise<GeneratedEvaluation> => {
  try {
    const ai = getAIClient();

    const schema = {
      type: Type.OBJECT,
      properties: {
        subject: { type: Type.STRING },
        grade: { type: Type.STRING },
        bimester: { type: Type.STRING },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              textFragment: { type: Type.STRING },
              questionText: { type: Type.STRING },
              options: {
                type: Type.OBJECT,
                properties: {
                  a: { type: Type.STRING },
                  b: { type: Type.STRING },
                  c: { type: Type.STRING },
                  d: { type: Type.STRING },
                  e: { type: Type.STRING }
                },
                required: ["a", "b", "c", "d", "e"]
              },
              correctOption: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["id", "textFragment", "questionText", "options", "correctOption", "difficulty", "explanation"]
          }
        }
      },
      required: ["subject", "grade", "bimester", "questions"]
    };

    const prompt = `Gere uma avaliação de ${subjectName} para a ${grade}ª Série, ${bimester}º Bimestre. 
    Conteúdos: ${topics.join(", ")}. Estilo ENEM (A-E). Retorne apenas JSON.`;

    // Fix: Simplify contents format to a direct string as per GenAI SDK guidelines
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Você é um professor avaliador experiente.",
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    // Fix: Use the .text property directly (not a method) on GenerateContentResponse
    if (!response.text) throw new Error("A IA não retornou conteúdo.");
    return JSON.parse(response.text.trim()) as GeneratedEvaluation;
  } catch (error: any) {
    console.error("Erro na IA:", error);
    throw new Error("Falha na comunicação com o serviço de inteligência artificial.");
  }
};

export const evaluateActivities = async (
  lessonTitle: string,
  theoryContext: string,
  questionsAndAnswers: { question: string; answer: string }[]
): Promise<AIResponse> => {
  try {
    const ai = getAIClient();

    const schema = {
      type: Type.OBJECT,
      properties: {
        generalComment: { type: Type.STRING },
        corrections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              studentAnswer: { type: Type.STRING },
              isCorrect: { type: Type.BOOLEAN },
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING }
            }
          }
        }
      },
      required: ["generalComment", "corrections"]
    };

    const prompt = `Analise as respostas com base na teoria: ${theoryContext.substring(0, 1000)}. Aula: ${lessonTitle}. Respostas: ${JSON.stringify(questionsAndAnswers)}`;

    // Fix: Simplify contents format to a direct string as per GenAI SDK guidelines
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Você é um tutor acadêmico. Forneça feedbacks construtivos.",
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    // Fix: Use the .text property directly (not a method) on GenerateContentResponse
    return JSON.parse(response.text || "{}") as AIResponse;
  } catch (error: any) {
    throw new Error("Erro na análise automática: " + error.message);
  }
};

export const generatePedagogicalSummary = async (
  context: "INDIVIDUAL" | "TURMA",
  data: {
    subject: string,
    grades: number[],
    notes: string[],
    studentName?: string,
    schoolClass: string
  }
): Promise<string> => {
  try {
    const ai = getAIClient();
    const prompt = `Gere um relatório pedagógico em Markdown para ${context}. Matéria: ${data.subject}. Dados: ${JSON.stringify(data)}`;

    // Fix: Simplify contents format to a direct string as per GenAI SDK guidelines
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Você é um Coordenador Pedagógico sênior."
      }
    });
    // Fix: Use the .text property directly (not a method) on GenerateContentResponse
    return response.text || "Erro ao gerar resumo.";
  } catch (error: any) {
    return "Falha na síntese de dados: " + error.message;
  }
};
