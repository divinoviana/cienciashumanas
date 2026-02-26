
import { GoogleGenAI, Type } from "@google/genai";
import { ChartData, TableData, CrosswordData, ActivityImage } from "../types";

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
  visualContent?: {
    type: 'image' | 'chart' | 'table' | 'crossword';
    data: any;
  };
}

export interface LessonPlan {
  title: string;
  objectives: string[];
  theory: string;
  methodology: {
    introduction: string; // 10 min
    development: string; // 30 min
    conclusion: string; // 10 min
  };
  suggestedActivity: string;
}

// Novo: Estrutura para atividade de aula do aluno
export interface ObjectiveQuestion {
  id: string;
  question: string;
  options: { a: string; b: string; c: string; d: string; e: string; };
  correctOption: string;
}

export interface DiscursiveQuestion {
  id: string;
  question: string;
}

export interface LessonActivity {
  objectives: ObjectiveQuestion[];
  discursives: DiscursiveQuestion[];
  visualContent?: {
    type: 'image' | 'chart' | 'table' | 'crossword';
    data: any; // Will be cast to specific type
  };
}

/**
 * Função utilitária para pausar a execução (usada no Retry)
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wrapper para chamadas da IA com tentativa de reenvio automático em caso de erro 429.
 */
const callAIWithRetry = async (fn: () => Promise<any>, retries = 3, delay = 2000): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaError = error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED");
    
    if (isQuotaError && retries > 0) {
      console.warn(`Limite de cota atingido. Tentando novamente em ${delay/1000}s... (${retries} tentativas restantes)`);
      await sleep(delay);
      return callAIWithRetry(fn, retries - 1, delay * 2); 
    }
    throw error;
  }
};

const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("Erro de Configuração: API_KEY não detectada. Certifique-se de que a chave está configurada no ambiente.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateActivityImage = async (prompt: string): Promise<string> => {
  return callAIWithRetry(async () => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Gere uma ilustração didática e séria para uma aula de Ciências Humanas sobre: ${prompt}. Estilo: Ilustração vetorial limpa, cores sóbrias, adequada para material escolar.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Falha ao gerar imagem.");
  });
};

// Nova função para gerar a atividade 5+2 para o aluno
export const generateLessonActivity = async (lessonTitle: string, theory: string): Promise<LessonActivity> => {
  return callAIWithRetry(async () => {
    const ai = getAIClient();
    const schema = {
      type: Type.OBJECT,
      properties: {
        objectives: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: {
                type: Type.OBJECT,
                properties: {
                  a: { type: Type.STRING }, b: { type: Type.STRING },
                  c: { type: Type.STRING }, d: { type: Type.STRING },
                  e: { type: Type.STRING }
                },
                required: ["a", "b", "c", "d", "e"]
              },
              correctOption: { type: Type.STRING }
            },
            required: ["id", "question", "options", "correctOption"]
          }
        },
        discursives: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING }
            },
            required: ["id", "question"]
          }
        },
        visualContent: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "Tipo de conteúdo visual: 'chart', 'table' ou 'crossword'" },
            data: { type: Type.OBJECT, description: "Dados estruturados para o componente visual" }
          },
          required: ["type", "data"]
        }
      },
      required: ["objectives", "discursives"]
    };

    const prompt = `Com base na aula "${lessonTitle}" e na teoria fornecida: "${theory.substring(0, 2000)}", gere:
    1. EXATAMENTE 5 questões de múltipla escolha (objetivas) com 5 alternativas cada (A-E).
    2. EXATAMENTE 2 questões discursivas (abertas) que exijam reflexão crítica do aluno.
    3. UM CONTEÚDO VISUAL COMPLEMENTAR (opcional, mas recomendado se o tema permitir):
       - Se for 'chart': Gere dados para um gráfico (bar, line ou pie) com 'title' e 'data' (array de {name, value}).
       - Se for 'table': Gere uma tabela com 'title', 'headers' e 'rows'.
       - Se for 'crossword': Gere uma palavra cruzada com 'grid' (array 2D de letras/espaços) e 'clues' (across/down com number, clue, answer, row, col).
    
    As questões devem ser desafiadoras e adequadas ao Ensino Médio.`;

    // Run text and image generation in parallel
    const [response, imageUrlResult] = await Promise.allSettled([
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "Você é um professor avaliador experiente. Siga rigorosamente o schema JSON. Para palavras cruzadas, garanta que o grid seja consistente com as dicas.",
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
      generateActivityImage(lessonTitle)
    ]);

    if (response.status === 'rejected') throw new Error("IA não retornou atividade.");
    if (!response.value.text) throw new Error("IA não retornou atividade.");
    
    const activity = JSON.parse(response.value.text.trim()) as LessonActivity;

    if (imageUrlResult.status === 'fulfilled' && imageUrlResult.value) {
      activity.visualContent = activity.visualContent || { type: 'image', data: { url: imageUrlResult.value, caption: `Ilustração sobre ${lessonTitle}` } };
    } else {
      console.warn("Não foi possível gerar imagem, continuando com outros conteúdos.");
    }

    return activity;
  });
};

export const generateLessonPlan = async (subject: string, theme: string, grade: string): Promise<LessonPlan> => {
  return callAIWithRetry(async () => {
    const ai = getAIClient();
    const schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
        theory: { type: Type.STRING },
        methodology: {
          type: Type.OBJECT,
          properties: {
            introduction: { type: Type.STRING },
            development: { type: Type.STRING },
            conclusion: { type: Type.STRING }
          },
          required: ["introduction", "development", "conclusion"]
        },
        suggestedActivity: { type: Type.STRING }
      },
      required: ["title", "objectives", "theory", "methodology", "suggestedActivity"]
    };

    const prompt = `Gere plano de aula: ${subject}, ${grade}ª série. Tema: "${theme}".`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Professor mentor. Plano de 50 min.",
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    if (!response.text) throw new Error("IA retornou vazio.");
    return JSON.parse(response.text.trim()) as LessonPlan;
  });
};

export const generateBimonthlyEvaluation = async (
  subjectName: string,
  grade: string,
  bimester: string,
  topics: string[]
): Promise<GeneratedEvaluation> => {
  return callAIWithRetry(async () => {
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
                  a: { type: Type.STRING }, b: { type: Type.STRING },
                  c: { type: Type.STRING }, d: { type: Type.STRING },
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
        },
        visualContent: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "Tipo de conteúdo visual: 'chart', 'table' ou 'crossword'" },
            data: { type: Type.OBJECT, description: "Dados estruturados para o componente visual" }
          },
          required: ["type", "data"]
        }
      },
      required: ["subject", "grade", "bimester", "questions"]
    };

    const prompt = `Gere avaliação de ${subjectName}, ${grade}ª Série, ${bimester}º Bimestre. Tópicos: ${topics.join(', ')}.
    Inclua um recurso visual (gráfico, tabela ou palavra cruzada) que ajude na interpretação das questões.`;

    // Run text and image generation in parallel
    const [response, imageUrlResult] = await Promise.allSettled([
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "Gere 5 questões ENEM. Siga rigorosamente o schema JSON.",
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
      generateActivityImage(`Avaliação de ${subjectName}: ${topics[0]}`)
    ]);

    if (response.status === 'rejected') throw new Error("IA retornou vazio.");
    if (!response.value.text) throw new Error("IA retornou vazio.");
    
    const evaluation = JSON.parse(response.value.text.trim()) as GeneratedEvaluation;

    if (imageUrlResult.status === 'fulfilled' && imageUrlResult.value) {
      evaluation.visualContent = evaluation.visualContent || { type: 'image', data: { url: imageUrlResult.value, caption: `Contexto para a avaliação de ${subjectName}` } };
    } else {
      console.warn("Não foi possível gerar imagem para avaliação.");
    }

    return evaluation;
  });
};

export const evaluateActivities = async (
  lessonTitle: string,
  theoryContext: string,
  questionsAndAnswers: { question: string; answer: string }[]
): Promise<AIResponse> => {
  return callAIWithRetry(async () => {
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

    const prompt = `Corrija as respostas do aluno para a aula ${lessonTitle}. Respostas: ${JSON.stringify(questionsAndAnswers)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Tutor acadêmico. Avalie brevemente as respostas.",
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    if (!response.text) throw new Error("Sem resposta.");
    return JSON.parse(response.text) as AIResponse;
  });
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
  return callAIWithRetry(async () => {
    const ai = getAIClient();
    const prompt = `Relatório ${context} - ${data.subject}. Dados: ${JSON.stringify(data)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Coordenador Pedagógico. Gere um resumo Markdown."
      }
    });
    
    return response.text || "Erro ao gerar.";
  });
};
