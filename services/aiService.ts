
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
 * Inicializa a IA usando a chave de ambiente protegida injetada pelo Vite/Vercel.
 */
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  
  // Se a chave for undefined ou a string "undefined" (comum em erros de build)
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.error("ERRO CRÍTICO: API_KEY não foi injetada no sistema.");
    throw new Error("Sistema de IA offline: A chave de acesso não foi configurada corretamente no servidor.");
  }
  
  return new GoogleGenAI({ apiKey });
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
      Conteúdos a serem avaliados: ${topics.join(", ")}.
      As questões devem ser de múltipla escolha (A a E) no estilo ENEM.
      Retorne os dados apenas no formato JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "Você é um professor avaliador experiente. Gere questões com alto rigor pedagógico.",
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.5,
      },
    });

    if (!response.text) throw new Error("A IA não gerou conteúdo.");
    return JSON.parse(response.text.trim()) as GeneratedEvaluation;
  } catch (error: any) {
    console.error("Erro na geração da avaliação:", error);
    throw new Error(error.message || "Falha ao conectar com o serviço de IA.");
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

    const prompt = `Avalie as respostas abaixo com base nesta teoria: ${theoryContext.substring(0, 1000)}.
      Título da aula: ${lessonTitle}.
      Respostas do aluno: ${JSON.stringify(questionsAndAnswers)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "Você é um professor tutor. Forneça correções construtivas e atribua notas de 0 a 10 para cada resposta.",
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    return JSON.parse(response.text || "{}") as AIResponse;
  } catch (error: any) {
    console.error("Erro na avaliação de atividades:", error);
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
    const prompt = `Crie um relatório pedagógico analítico em Markdown.
      Contexto: ${context}
      Disciplina: ${data.subject}
      Notas: ${data.grades.join(", ")}
      Observações do Professor: ${data.notes.join(" | ")}
      ${data.studentName ? `Estudante: ${data.studentName}` : `Turma: ${data.schoolClass}`}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "Você é um Coordenador Pedagógico. Gere relatórios formais, técnicos e humanizados."
      }
    });
    return response.text || "Não foi possível gerar o resumo.";
  } catch (error: any) {
    return "Falha na síntese de dados: " + error.message;
  }
};
