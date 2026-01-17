export type Subject = 'filosofia' | 'geografia' | 'historia' | 'sociologia';

export interface Activity {
  id: string;
  title: string;
  description: string;
  questions?: string[];
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