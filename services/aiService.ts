
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

export const generateBimonthlyEvaluation = async (
  subjectName: string,
  grade: string,
  bimester: string,
  topics: string[]
): Promise<GeneratedEvaluation> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Configuração de API pendente. Contate o suporte.");

  const ai = new GoogleGenAI({ apiKey });

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

  const systemInstruction = "Você é um professor especialista em avaliações do ENEM. Gere questões de múltipla escolha com alta qualidade pedagógica.";

  const prompt = `Gere uma prova de ${subjectName} para a ${grade}ª Série, ${bimester}º Bimestre.
    Temas: ${topics.join(", ")}.
    Crie 5 questões com textos motivadores (fragmentos de autores ou fatos históricos).
    Retorne os dados EXCLUSIVAMENTE em formato JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Flash é mais estável para safras constantes de JSON
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.4, // Menor temperatura para maior consistência na estrutura
      },
    });

    if (!response.text) throw new Error("Resposta da IA vazia.");
    return JSON.parse(response.text.trim()) as GeneratedEvaluation;
  } catch (error: any) {
    console.error("Erro na IA:", error);
    throw new Error(error.message || "Erro ao conectar com servidor de IA.");
  }
};

export const evaluateActivities = async (
  lessonTitle: string,
  theoryContext: string,
  questionsAndAnswers: { question: string; answer: string }[]
): Promise<AIResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Configuração de API pendente.");

  const ai = new GoogleGenAI({ apiKey });

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

  const systemInstruction = `Você é um professor avaliador de ${lessonTitle}. Dê feedbacks encorajadores.`;
  const prompt = `Teoria Base: ${theoryContext.substring(0, 1000)}. Respostas: ${JSON.stringify(questionsAndAnswers)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
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
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Configuração de API pendente.");

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = "Você é um Coordenador Pedagógico sênior. Gere relatórios profissionais em Markdown.";
  const prompt = `Analise o desempenho em ${data.subject}. Tipo: ${context}. Turma: ${data.schoolClass}. Notas: [${data.grades.join(", ")}]. Notas do professor: ${data.notes.join("; ")}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { systemInstruction }
    });
    return response.text || "Erro ao gerar relatório.";
  } catch (error: any) {
    return "Falha na síntese: " + error.message;
  }
};
