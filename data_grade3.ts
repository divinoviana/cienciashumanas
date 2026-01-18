import { Grade } from './types';
import { geoLessonsB1, geoLessonsB2, geoLessonsB3, geoLessonsB4 } from './data_grade3_geografia';
import { hisLessonsB1, hisLessonsB2, hisLessonsB3, hisLessonsB4 } from './data_grade3_historia';
import { phiLessonsB1, phiLessonsB2, phiLessonsB3, phiLessonsB4 } from './data_grade3_filosofia';
import { socLessonsB1, socLessonsB2, socLessonsB3, socLessonsB4 } from './data_grade3_sociologia';

export const grade3Data: Grade = {
  id: 3, 
  title: "3ª Série", 
  description: "Ciências Humanas e Sociais Aplicadas - Preparação e Mundo Contemporâneo", 
  color: "bg-purple-600",
  bimesters: [
    { 
      id: 1, 
      title: "1º Bimestre", 
      subjectTitles: {
          geografia: "Geografia - 1º Bim: Urbanização e Mundo Rural",
          historia: "História - 1º Bim: Ambiguidades e Conflitos de Terra",
          filosofia: "Filosofia - 1º Bim: Racionalismo e Lógica Formal",
          sociologia: "Sociologia - 1º Bim: Evolução, Progresso e Modernidade"
      },
      lessons: [...geoLessonsB1, ...hisLessonsB1, ...phiLessonsB1, ...socLessonsB1] 
    },
    { 
      id: 2, 
      title: "2º Bimestre", 
      subjectTitles: {
          geografia: "Geografia - 2º Bim: Cartografia, Território e Identidade",
          historia: "História - 2º Bim: Formação Social e Movimentos no Brasil",
          filosofia: "Filosofia - 2º Bim: Estética Digital e Existencialismo",
          sociologia: "Sociologia - 2º Bim: Cultura Digital, Espaço e Poder"
      },
      lessons: [...geoLessonsB2, ...hisLessonsB2, ...phiLessonsB2, ...socLessonsB2] 
    },
    { 
      id: 3, 
      title: "3º Bimestre", 
      subjectTitles: {
          geografia: "Geografia - 3º Bim: Indústria, Turismo e Globalização",
          historia: "História - 3º Bim: Urbanismo, Saúde e Trabalho Escravo",
          filosofia: "Filosofia - 3º Bim: Bioética, Poder e Linguagem",
          sociologia: "Sociologia - 3º Bim: Consumo, Descarte e Precarização do Trabalho"
      },
      lessons: [...geoLessonsB3, ...hisLessonsB3, ...phiLessonsB3, ...socLessonsB3] 
    },
    { 
      id: 4, 
      title: "4º Bimestre", 
      subjectTitles: {
          geografia: "Geografia - 4º Bim: Mercado de Trabalho e Renda Jovem",
          historia: "História - 4º Bim: Juventude, Memória e Trabalho",
          filosofia: "Filosofia - 4º Bim: Ética Econômica e a Mente Humana",
          sociologia: "Sociologia - 4º Bim: Trabalho, Tecnologia e Perspectivas Regionais"
      },
      lessons: [...geoLessonsB4, ...hisLessonsB4, ...phiLessonsB4, ...socLessonsB4] 
    }
  ]
};
