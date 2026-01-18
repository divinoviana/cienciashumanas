import { Grade } from './types';
import { geoLessonsB1, geoLessonsB2, geoLessonsB3, geoLessonsB4 } from './data_grade2_geografia';
import { hisLessonsB1, hisLessonsB2, hisLessonsB3, hisLessonsB4 } from './data_grade2_historia';
import { phiLessonsB1, phiLessonsB2, phiLessonsB3, phiLessonsB4 } from './data_grade2_filosofia';
import { socLessonsB1, socLessonsB2, socLessonsB3, socLessonsB4 } from './data_grade2_sociologia';

export const grade2Data: Grade = {
  id: 2, 
  title: "2ª Série", 
  description: "Ciências Humanas e Sociais Aplicadas - Aprofundamento", 
  color: "bg-indigo-600",
  bimesters: [
    { 
      id: 1, 
      title: "1º Bimestre", 
      subjectTitles: {
          geografia: "Geografia - 1º Bim: Revoluções Industriais e Capitalismo",
          historia: "História - 1º Bim: Civilizações Clássicas e Revoluções Modernas",
          filosofia: "Filosofia - 1º Bim: Liberalismo e Teorias Contratualistas",
          sociologia: "Sociologia - 1º Bim: Trabalho, Estratificação e Ética Social"
      },
      lessons: [...geoLessonsB1, ...hisLessonsB1, ...phiLessonsB1, ...socLessonsB1] 
    },
    { 
      id: 2, 
      title: "2º Bimestre", 
      subjectTitles: {
          geografia: "Geografia - 2º Bim: Fluxos Econômicos e Regionalização",
          historia: "História - 2º Bim: Verdade Histórica e Movimentos Juvenis",
          filosofia: "Filosofia - 2º Bim: Modernidade Líquida e a Ética da Alteridade",
          sociologia: "Sociologia - 2º Bim: Tecnologias, Redes e Culturas Juvenis"
      },
      lessons: [...geoLessonsB2, ...hisLessonsB2, ...phiLessonsB2, ...socLessonsB2] 
    },
    { 
      id: 3, 
      title: "3º Bimestre", 
      subjectTitles: {
          geografia: "Geografia - 3º Bim: Produção, Consumo e Logística Global",
          historia: "História - 3º Bim: Indústria Cultural e a Evolução do Trabalho",
          filosofia: "Filosofia - 3º Bim: Ideologia e a Filosofia do Trabalho",
          sociologia: "Sociologia - 3º Bim: Indústria Cultural e o Novo Mundo do Trabalho"
      },
      lessons: [...geoLessonsB3, ...hisLessonsB3, ...phiLessonsB3, ...socLessonsB3] 
    },
    { 
      id: 4, 
      title: "4º Bimestre", 
      subjectTitles: {
          geografia: "Geografia - 4º Bim: Nova Ordem, Estado e Blocos Econômicos",
          historia: "História - 4º Bim: Democracia e a Geopolítica da Paz",
          filosofia: "Filosofia - 4º Bim: Microfísica do Poder e o Estado Coletivo",
          sociologia: "Sociologia - 4º Bim: Poder, Regimes e Governança Global"
      },
      lessons: [...geoLessonsB4, ...hisLessonsB4, ...phiLessonsB4, ...socLessonsB4] 
    }
  ]
};
