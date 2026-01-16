
import { GoogleGenAI, Type } from "@google/genai";

// Não inicializamos a IA no topo do arquivo para evitar que o site quebre 
// caso a API Key não esteja configurada no carregamento inicial.

export interface CorrectionResult {
  question: string;
  studentAnswer: string;
  isCorrect: boolean;
  score: number; // 0 a 10
  feedback: string;
}

export interface AIResponse {
  generalComment: string;
  corrections: CorrectionResult[];
}

export const evaluateActivities = async (
  lessonTitle: string,
  theoryContext: string,
  questionsAndAnswers: { question: string; answer: string }[]
): Promise<AIResponse> => {
  
  // Verificação de segurança no momento da chamada
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("A chave de API (API Key) não está configurada no sistema. Entre em contato com o professor.");
  }

  // Inicializa apenas quando necessário com o formato correto de objeto nomeado
  const ai = new GoogleGenAI({ apiKey });

  if (!questionsAndAnswers || questionsAndAnswers.length === 0) {
    throw new Error("Nenhuma resposta para avaliar.");
  }

  // Definição do Schema de Resposta para garantir JSON estruturado usando Type enum
  const schema = {
    type: Type.OBJECT,
    properties: {
      generalComment: {
        type: Type.STRING,
        description: "Um comentário geral encorajador sobre o desempenho do aluno, adotando a persona de um professor de filosofia socrático e gentil.",
      },
      corrections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            studentAnswer: { type: Type.STRING },
            isCorrect: { 
              type: Type.BOOLEAN,
              description: "True se a resposta demonstra compreensão correta do conceito, False se houver erro grave."
            },
            score: { 
              type: Type.NUMBER,
              description: "Nota de 0 a 10 para a resposta."
            },
            feedback: {
              type: Type.STRING,
              description: "Feedback específico. Se errou, explique o conceito correto. Se acertou, elogie ou aprofunde."
            }
          },
          propertyOrdering: ["question", "studentAnswer", "isCorrect", "score", "feedback"]
        }
      }
    },
    required: ["generalComment", "corrections"]
  };

  const prompt = `
    Você é um Professor de Filosofia do Ensino Médio experiente, didático e gentil.
    
    Contexto da Aula: "${lessonTitle}"
    Resumo da Teoria: "${theoryContext.substring(0, 3000)}"
    
    Tarefa: Avalie as respostas do aluno abaixo.
    Critérios:
    1. Verifique se a resposta está filosoficamente correta com base na teoria.
    2. Valorize o pensamento crítico e a reflexão pessoal.
    3. Se a resposta for curta demais ou vaga, peça mais elaboração no feedback.
    4. Seja construtivo. Não dê apenas a resposta certa, mas guie o aluno.

    Respostas do Aluno:
    ${JSON.stringify(questionsAndAnswers)}
  `;

  try {
    // Usando ai.models.generateContent diretamente conforme as diretrizes
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.3, // Baixa temperatura para avaliações mais consistentes
      },
    });

    // Acessando .text como propriedade, não método
    const result = JSON.parse(response.text || "{}");
    return result as AIResponse;

  } catch (error) {
    console.error("Erro ao avaliar com IA:", error);
    throw new Error("Não foi possível conectar ao assistente de correção. Verifique sua conexão ou a chave de API.");
  }
};