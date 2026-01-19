
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
  if (!apiKey) throw new Error("API Key não configurada.");

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
            textFragment: { type: Type.STRING, description: "Um fragmento de texto motivador, filósofo ou contexto histórico." },
            questionText: { type: Type.STRING, description: "O enunciado da questão baseado no texto." },
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
            correctOption: { type: Type.STRING, description: "Apenas a letra da opção correta (a, b, c, d ou e)." },
            difficulty: { type: Type.STRING, enum: ["Fácil", "Médio", "Difícil"] },
            explanation: { type: Type.STRING, description: "Explicação por que essa é a resposta correta baseada no conteúdo." }
          },
          required: ["id", "textFragment", "questionText", "options", "correctOption", "difficulty", "explanation"]
        }
      }
    },
    required: ["subject", "grade", "bimester", "questions"]
  };

  const prompt = `
    Você é um especialista em elaboração de itens para o ENEM (Exame Nacional do Ensino Médio).
    Crie uma Avaliação Bimestral de ${subjectName} para a ${grade}ª Série, relativa ao ${bimester}º Bimestre.
    
    Conteúdos a serem abordados: ${topics.join(", ")}.
    
    Regras da Avaliação:
    1. Gere exatamente 5 questões de múltipla escolha (A a E).
    2. Cada questão deve começar com um fragmento de texto (filosófico, geográfico, sociológico ou histórico) para interpretação.
    3. Siga a lógica TRI (Teoria de Resposta ao Item):
       - 2 questões fáceis (conceitos básicos).
       - 2 questões médias (correlação e aplicação).
       - 1 questão difícil (análise crítica complexa).
    4. O enunciado deve ser contextualizado, evitando perguntas diretas do tipo "o que é".
    5. As alternativas devem ter distratores plausíveis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    return JSON.parse(response.text || "{}") as GeneratedEvaluation;
  } catch (error) {
    console.error("Erro na IA:", error);
    throw new Error("Falha ao gerar avaliação via IA.");
  }
};

export const evaluateActivities = async (
  lessonTitle: string,
  theoryContext: string,
  questionsAndAnswers: { question: string; answer: string }[]
): Promise<AIResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("A chave de API (API Key) não está configurada.");
  }

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

  const prompt = `Avalie como um professor de ${lessonTitle}. Teoria: ${theoryContext.substring(0, 2000)}. Respostas: ${JSON.stringify(questionsAndAnswers)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.3,
      },
    });
    return JSON.parse(response.text || "{}") as AIResponse;
  } catch (error) {
    throw new Error("Erro na conexão com o assistente.");
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
  if (!apiKey) throw new Error("API Key não configurada.");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Atue como um Coordenador Pedagógico especialista em Ciências Humanas.
    Gere um relatório analítico e profissional em português para o professor de ${data.subject}.
    
    TIPO DE RELATÓRIO: ${context}
    ${data.studentName ? `ESTUDANTE: ${data.studentName}` : ''}
    TURMA: ${data.schoolClass}
    HISTÓRICO DE NOTAS: ${data.grades.join(", ")}
    OBSERVAÇÕES DO PROFESSOR: ${data.notes.join(" | ")}
    
    O relatório deve conter:
    1. Resumo do Desempenho (tendência de notas).
    2. Análise de Comportamento/Participação baseada nas observações.
    3. Sugestões de Intervenção Pedagógica (pontos a reforçar).
    
    Mantenha um tom ético, encorajador e focado no crescimento do aluno.
    Use Markdown para formatação.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { temperature: 0.5 }
    });
    return response.text || "Não foi possível gerar o relatório.";
  } catch (e) {
    return "Erro ao processar síntese pedagógica com IA.";
  }
};
