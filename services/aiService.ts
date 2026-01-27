
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
 * Inicializa a IA usando a chave de ambiente protegida.
 */
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY não encontrada no ambiente. Verifique as configurações do Vercel.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateBimonthlyEvaluation = async (
  subjectName: string,
  grade: string,
  bimester: string,
  topics: string[]
): Promise<GeneratedEvaluation> => {
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

  const systemInstruction = "Você é um professor especialista em avaliações do ENEM. Gere questões de múltipla escolha com alta qualidade pedagógica e textos motivadores profundos.";

  const prompt = `Gere uma prova de ${subjectName} para a ${grade}ª Série, ${bimester}º Bimestre.
    Temas: ${topics.join(", ")}.
    Crie 5 questões originais com fragmentos de autores ou fatos históricos.
    Retorne os dados estritamente no formato JSON definido no schema.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.4,
      },
    });

    if (!response.text) throw new Error("A IA retornou uma resposta vazia.");
    return JSON.parse(response.text.trim()) as GeneratedEvaluation;
  } catch (error: any) {
    console.error("Erro na geração da avaliação:", error);
    throw new Error("Falha na IA: A chave de API pode estar incorreta ou sem créditos.");
  }
};

export const evaluateActivities = async (
  lessonTitle: string,
  theoryContext: string,
  questionsAndAnswers: { question: string; answer: string }[]
): Promise<AIResponse> => {
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

  const systemInstruction = `Você é um professor avaliador da disciplina que engloba o tema: ${lessonTitle}. Forneça correções pedagógicas, críticas e encorajadoras.`;
  const prompt = `Teoria de base: ${theoryContext.substring(0, 1500)}. 
    Analise as seguintes respostas dos alunos e atribua notas de 0 a 10: 
    ${JSON.stringify(questionsAndAnswers)}`;

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
  const ai = getAIClient();
  
  const systemInstruction = "Você é um Coordenador Pedagógico experiente. Sua tarefa é criar um relatório formal e analítico em Markdown sobre o desempenho escolar.";
  
  const prompt = `Analise os seguintes dados pedagógicos:
    Contexto: ${context}
    Disciplina: ${data.subject}
    Turma: ${data.schoolClass}
    ${data.studentName ? `Aluno: ${data.studentName}` : ''}
    Notas das Atividades: [${data.grades.join(", ")}]
    Observações do Professor: ${data.notes.join(" | ")}
    
    Crie um parecer técnico com pontos fortes, desafios e sugestões de intervenção.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { systemInstruction }
    });
    return response.text || "Não foi possível gerar o resumo pedagógico.";
  } catch (error: any) {
    return "Falha na síntese de dados: " + error.message;
  }
};
