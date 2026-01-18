import { Grade } from './types';
import { geoLessonsB1, geoLessonsB2, geoLessonsB3, geoLessonsB4 } from './data_grade1_geografia';
import { hisLessonsB1, hisLessonsB2, hisLessonsB3, hisLessonsB4 } from './data_grade1_historia';
import { phiLessonsB1, phiLessonsB2, phiLessonsB3, phiLessonsB4 } from './data_grade1_filosofia';
import { socLessonsB1, socLessonsB2, socLessonsB3, socLessonsB4 } from './data_grade1_sociologia';

export const grade1Data: Grade = {
  id: 1,
  title: "1ª Série",
  description: "Ciências Humanas e Sociais Aplicadas",
  color: "bg-blue-600",
  bimesters: [
    {
      id: 1,
      title: "1º Bimestre",
      subjectTitles: {
          geografia: "Geografia - 1º Bim: Dinâmicas do Espaço e Urbanização",
          historia: "História - 1º Bim: Ciência Histórica, Memória e Iluminismo",
          filosofia: "Filosofia - 1º Bim: Nascimento da Filosofia e Ética Clássica",
          sociologia: "Sociologia - 1º Bim: Indivíduo, Socialização e Instituições"
      },
      lessons: [...geoLessonsB1, ...hisLessonsB1, ...phiLessonsB1, ...socLessonsB1]
    },
    {
      id: 2,
      title: "2º Bimestre",
      subjectTitles: {
          geografia: "Geografia - 2º Bim: Dinâmicas de Poder e Ambiente Global",
          historia: "História - 2º Bim: Migrações, Refúgio e a História do Tocantins",
          filosofia: "Filosofia - 2º Bim: Ideologia, Alteridade e Ética da Responsabilidade",
          sociologia: "Sociologia - 2º Bim: Território, Conflitos e Cidadania Ambiental"
      },
      lessons: [...geoLessonsB2, ...hisLessonsB2, ...phiLessonsB2, ...socLessonsB2]
    },
    {
      id: 3,
      title: "3º Bimestre",
      subjectTitles: {
          geografia: "Geografia - 3º Bim: Indicadores, Desigualdade e Trabalho",
          historia: "História - 3º Bim: Evolução do Trabalho e História Constitucional",
          filosofia: "Filosofia - 3º Bim: Alienação, Consumo e a Autonomia do Eu",
          sociologia: "Sociologia - 3º Bim: Estratificação, Mobilidade e Justiça Social"
      },
      lessons: [...geoLessonsB3, ...hisLessonsB3, ...phiLessonsB3, ...socLessonsB3]
    },
    {
      id: 4,
      title: "4º Bimestre",
      subjectTitles: {
          geografia: "Geografia - 4º Bim: Território, Identidade e Conflitos Agrários",
          historia: "História - 4º Bim: Movimentos Sociais e Cidadania Contemporânea",
          filosofia: "Filosofia - 4º Bim: O Contrato Social e as Minorias",
          sociologia: "Sociologia - 4º Bim: Diáspora Africana e Relações Étnico-Raciais"
      },
      lessons: [...geoLessonsB4, ...hisLessonsB4, ...phiLessonsB4, ...socLessonsB4]
    }
  ]
};
