export type Subject = 'filosofia' | 'geografia' | 'historia' | 'sociologia';

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  data: { name: string; value: number }[];
  title: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  title: string;
}

export interface CrosswordData {
  grid: string[][]; // Empty cells as null or space
  clues: {
    across: { number: number; clue: string; answer: string; row: number; col: number }[];
    down: { number: number; clue: string; answer: string; row: number; col: number }[];
  };
}

export interface ActivityImage {
  url: string;
  caption: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  questions?: string[];
  image?: ActivityImage;
  chart?: ChartData;
  table?: TableData;
  crossword?: CrosswordData;
}

export interface Lesson {
  id: string;
  title: string;
  subject: Subject;
  objectives: string[];
  theory: string;
  methodology: string;
  activities: Activity[];
  reflectionQuestions: string[];
}

export interface Bimester {
  id: number;
  title: string; // Título padrão/genérico
  subjectTitles?: Record<string, string>; // Títulos específicos por matéria
  lessons: Lesson[];
}

export interface Grade {
  id: number;
  title: string;
  description: string;
  color: string;
  bimesters: Bimester[];
}