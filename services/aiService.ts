
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
  if (!apiKey) throw new Error("API Key não encontrada no ambiente. Verifique o arquivo de configuração.");

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
            explanation: { type: Type.STRING, description: "Explicação pedagógica da resposta correta." }
          },
          required: ["id", "textFragment", "questionText", "options", "correctOption", "difficulty", "explanation"]
        }
      }
    },
    required: ["subject", "grade", "bimester", "questions"]
  };

  const systemInstruction = `Você é um consultor pedagógico sênior especialista em elaborar itens para o ENEM (Exame Nacional do Ensino Médio). 
  Seu objetivo é criar avaliações de alta qualidade técnica seguindo a Teoria de Resposta ao Item (TRI).`;

  const prompt = `Crie uma Avaliação Bimestral de ${subjectName} para a ${grade}ª Série, relativa ao ${bimester}º Bimestre.
    Conteúdos a serem abordados obrigatoriamente: ${topics.join(", ")}.
    
    Regras da Avaliação:
    1. Gere EXATAMENTE 5 questões inéditas de múltipla escolha.
    2. Cada questão deve iniciar com um "texto-base" (fragmento histórico, geográfico ou filosófico).
    3. Distribuição de Dificuldade: 2 Fáceis, 2 Médias, 1 Difícil.
    4. O comando da questão deve exigir análise e não apenas memorização.
    5. Retorne os dados estritamente no formato JSON solicitado.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Alterado para Pro para tarefas complexas
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    if (!response.text) {
      throw new Error("A IA retornou uma resposta vazia. Tente novamente.");
    }

    return JSON.parse(response.text.trim()) as GeneratedEvaluation;
  } catch (error: any) {
    console.error("Erro detalhado da IA:", error);
    // Retornamos o erro real para o usuário conseguir identificar se é cota, segurança ou chave
    throw new Error(error.message || "Erro desconhecido na comunicação com a IA.");
  }
};

export const evaluateActivities = async (
  lessonTitle: string,
  theoryContext: string,
  questionsAndAnswers: { question: string; answer: string }[]
): Promise<AIResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key não configurada.");

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

  const systemInstruction = `Você é um professor avaliador de ${lessonTitle}. Sua correção deve ser encorajadora e pedagógica.`;
  const prompt = `Analise as respostas do aluno baseando-se nesta teoria: ${theoryContext.substring(0, 1500)}.
  Respostas enviadas: ${JSON.stringify(questionsAndAnswers)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
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
  if (!apiKey) throw new Error("API Key não configurada.");

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = "Você é um Coordenador Pedagógico sênior. Seu tom deve ser profissional, ético e focado no crescimento acadêmico.";
  const prompt = `Gere um relatório analítico para o professor de ${data.subject}.
    TIPO: ${context} | TURMA: ${data.schoolClass} ${data.studentName ? `| ESTUDANTE: ${data.studentName}` : ''}
    DADOS: Notas: [${data.grades.join(", ")}] | Observações: ${data.notes.join(" | ")}
    O relatório deve conter Resumo de Desempenho e Sugestões de Intervenção em Markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { 
        systemInstruction,
        temperature: 0.5 
      }
    });
    return response.text || "Não foi possível gerar o texto do relatório.";
  } catch (error: any) {
    return "Erro ao processar síntese: " + error.message;
  }
};
