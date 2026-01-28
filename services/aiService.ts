
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
 * Cria uma instância do cliente de IA garantindo que a chave esteja presente.
 */
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.error("Erro: A chave API_KEY não foi encontrada no ambiente.");
    throw new Error("O serviço de inteligência artificial não foi configurado corretamente (Chave ausente).");
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
    Conteúdos: ${topics.join(", ")}. Estilo ENEM (questões contextuais com alternativas A a E).`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Você é um professor avaliador experiente de Ciências Humanas.",
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    if (!response.text) throw new Error("A IA não retornou o conteúdo esperado.");
    return JSON.parse(response.text.trim()) as GeneratedEvaluation;
  } catch (error: any) {
    console.error("Erro na geração da prova:", error);
    throw new Error("Falha ao gerar avaliação: " + error.message);
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
            },
            required: ["question", "studentAnswer", "isCorrect", "score", "feedback"]
          }
        }
      },
      required: ["generalComment", "corrections"]
    };

    const prompt = `Corrija as respostas do aluno baseando-se nesta teoria: ${theoryContext.substring(0, 1500)}. 
    Aula: ${lessonTitle}. 
    Respostas: ${JSON.stringify(questionsAndAnswers)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Você é um professor tutor. Corrija com rigor acadêmico mas de forma incentivadora.",
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    if (!response.text) throw new Error("Sem resposta da IA.");
    return JSON.parse(response.text) as AIResponse;
  } catch (error: any) {
    console.error("Erro na correção:", error);
    throw new Error("Erro na análise da IA: " + error.message);
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
    const prompt = `Gere um relatório pedagógico analítico em Markdown para o contexto ${context}. 
    Disciplina: ${data.subject}. 
    Dados do desempenho: ${JSON.stringify(data)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Você é um Coordenador Pedagógico. Escreva relatórios formais e construtivos."
      }
    });
    
    return response.text || "Relatório não gerado.";
  } catch (error: any) {
    return "Falha na síntese dos dados pedagógicos: " + error.message;
  }
};
