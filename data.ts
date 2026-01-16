
import { Grade, Subject } from './types';

export const subjectsInfo: Record<Subject, { name: string; color: string; icon: string }> = {
  geografia: { name: 'Geografia', color: 'bg-emerald-500', icon: '🌍' },
  historia: { name: 'História', color: 'bg-amber-600', icon: '📜' },
  filosofia: { name: 'Filosofia', color: 'bg-indigo-600', icon: '🧠' },
  sociologia: { name: 'Sociologia', color: 'bg-rose-500', icon: '👥' }
};

export const curriculumData: Grade[] = [
  {
    id: 1,
    title: "1ª Série",
    description: "Fundamentos e Identidades Sociais",
    color: "bg-blue-600",
    bimesters: [
      {
        id: 1,
        title: "1º Bimestre: Fundamentos",
        lessons: [
          {
            id: "geo-1-1",
            subject: 'geografia',
            title: "Espaço Geográfico e Cerrado",
            objectives: ["Produção do espaço", "Paisagem do Tocantins"],
            theory: "O Espaço Geográfico no Tocantins...",
            methodology: "Análise de mapas.",
            activities: [{ id: "g1", title: "Atividade 1", description: "...", questions: ["Como o agronegócio altera o cerrado?"] }],
            reflectionQuestions: []
          },
          {
            id: "phi-1-1",
            subject: 'filosofia',
            title: "Mito ao Logos",
            objectives: ["Origens da Filosofia"],
            theory: "A passagem do pensamento mítico...",
            methodology: "Leitura de textos.",
            activities: [{ id: "p1", title: "Atividade 1", description: "...", questions: ["O que é Arché?"] }],
            reflectionQuestions: []
          }
        ]
      }
    ]
  }
];
