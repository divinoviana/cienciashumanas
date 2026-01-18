
import { Grade } from './types';
import { grade1Data } from './data_grade1';
import { grade2Data } from './data_grade2';
import { grade3Data } from './data_grade3';

// Re-exporta tudo para que os componentes continuem funcionando sem mudar os caminhos de importação
export * from './data_subjects';
export * from './data_admin';
export * from './data_grade1';
export * from './data_grade2';
export * from './data_grade3';

export const curriculumData: Grade[] = [
  grade1Data,
  grade2Data,
  grade3Data
];
