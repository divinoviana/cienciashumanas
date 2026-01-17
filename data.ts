
import { Grade, Subject, Lesson } from './types';

export const subjectsInfo: Record<Subject, { name: string; color: string; icon: string }> = {
  geografia: { name: 'Geografia', color: 'bg-emerald-500', icon: '🌍' },
  historia: { name: 'História', color: 'bg-amber-600', icon: '📜' },
  filosofia: { name: 'Filosofia', color: 'bg-indigo-600', icon: '🧠' },
  sociologia: { name: 'Sociologia', color: 'bg-rose-500', icon: '👥' }
};

// Helper para gerar aulas de forma mais limpa
const createLesson = (id: string, title: string, subject: Subject, theory: string, practiceTitle: string, practiceDesc: string, questions: string[]): Lesson => ({
  id,
  title,
  subject,
  objectives: ["Compreender os fundamentos da disciplina", "Relacionar conteúdo com a realidade local"],
  theory,
  methodology: "Leitura dirigida e atividade prática reflexiva.",
  activities: [
    {
      id: `${id}-act`,
      title: practiceTitle,
      description: practiceDesc,
      questions
    }
  ],
  reflectionQuestions: ["Como este tema impacta sua vida hoje?", "O que mudou na sua percepção após esta aula?"]
});

export const curriculumData: Grade[] = [
  {
    id: 1,
    title: "1ª Série",
    description: "Construção da identidade e fundamentos das ciências humanas",
    color: "bg-blue-600",
    bimesters: [
      { 
        id: 1, 
        title: "1º Bimestre: Fundamentos e Organização Social", 
        lessons: [
          createLesson('1-1-his-1', 'Conhecimento Histórico: Fato vs Opinião', 'historia', 
            'A História não é apenas uma narrativa do passado, mas uma ciência que utiliza fontes para distinguir fatos de opiniões e fake news.', 
            'Árvore das Origens', 'Investigue a origem de sua família para entender a produção de fontes históricas.', 
            ['Quais fontes (fotos, documentos, relatos) você encontrou sobre sua família?', 'Como a migração faz parte da história da sua família?', 'Por que é importante basear a história em fatos e não apenas em opiniões?']),
          createLesson('1-1-geo-1', 'Espaço Geográfico e Paisagem', 'geografia', 
            'O espaço geográfico é o resultado da interação entre sociedade e natureza ao longo do tempo.', 
            'Mapeando Meu Espaço', 'Use ferramentas digitais para comparar o passado e o presente do seu bairro.', 
            ['Quais foram as principais mudanças na paisagem do seu bairro nos últimos 10 anos?', 'Como a ação humana alterou a natureza local?', 'Identifique um elemento cultural e um natural na sua rua.']),
          createLesson('1-1-fil-1', 'Origem da Filosofia: Do Mito à Razão', 'filosofia', 
            'A Filosofia surge na Grécia antiga como uma busca por explicações racionais (Logos) para o mundo, superando os mitos.', 
            'Dilemas do Cotidiano', 'Reflexão sobre ética e moral no ambiente escolar.', 
            ['Você já tomou uma decisão baseada no "medo da punição" ou no "bem comum"? Explique.', 'Qual a diferença entre agir por impulso e agir pela razão?', 'Por que questionar o óbvio é o primeiro passo para o pensamento filosófico?']),
          createLesson('1-1-soc-1', 'Socialização e Instituições Sociais', 'sociologia', 
            'Nascemos indivíduos, mas nos tornamos seres sociais através das instituições como família, escola e redes sociais.', 
            'Minhas Instituições', 'Mapeie as instituições que moldam sua identidade.', 
            ['Quais regras de comportamento você aprendeu na família que são diferentes da escola?', 'Como as redes sociais influenciam quem você é hoje?', 'Cite um valor que você considera fundamental para viver em sociedade.'])
        ] 
      },
      { 
        id: 2, 
        title: "2º Bimestre: Dinâmicas de Poder e Ambiente", 
        lessons: [
          createLesson('1-2-his-1', 'Imigração e Urbanização no Brasil', 'historia', 
            'Estudo dos fluxos migratórios e como as políticas de urbanização moldaram o Brasil e o Tocantins.', 
            'Histórias de Migração', 'Entreviste alguém que veio de fora para morar na sua cidade.', 
            ['Por que essa pessoa escolheu o Tocantins?', 'Quais as dificuldades encontradas na chegada?', 'Como o trabalho dessa pessoa contribui para a economia local?']),
          createLesson('1-2-geo-1', 'Problemas Ambientais Urbanos', 'geografia', 
            'A urbanização acelerada traz desafios como o desperdício de água e a contaminação do solo.', 
            'Fiscal da Água', 'Monitore o consumo de água na sua casa por uma semana.', 
            ['Quantos litros de água sua família consome em média por dia?', 'Identifique dois pontos de desperdício na sua rotina.', 'Proponha uma ação prática para reduzir o consumo em sua escola.']),
          createLesson('1-2-fil-1', 'Ideologia e Democracia', 'filosofia', 
            'A ideologia pode ocultar a realidade. Entender a democracia exige pensamento crítico sobre o que nos é vendido como "natural".', 
            'Ideologia na Timeline', 'Análise crítica de discursos em redes sociais.', 
            ['Escolha um post de influenciador e identifique se há uma "ideologia de consumo" oculta.', 'O que significa dizer que algo é uma "construção social"?', 'Como a internet pode fortalecer ou enfraquecer a democracia?']),
          createLesson('1-2-soc-1', 'Território e Conflitos', 'sociologia', 
            'A disputa por terras e a demarcação de territórios indígenas são temas centrais no desenvolvimento sustentável.', 
            'Tribunal do Território', 'Simulação de argumentos sobre demarcação de terras.', 
            ['Quais são os principais argumentos de um grupo indígena pela sua terra?', 'Por que a preservação ambiental está ligada ao direito territorial?', 'Como o agronegócio e a sustentabilidade podem coexistir?'])
        ] 
      },
      {
        id: 3,
        title: "3º Bimestre: Trabalho e Desigualdade",
        lessons: [
          createLesson('1-3-his-1', 'Trabalho e Constituições no Brasil', 'historia', 'A evolução do trabalho no Brasil e os direitos garantidos pela Constituição de 1988.', 'Constituição Jovem', 'Criação de regras democráticas para a sala de aula.', ['Quais direitos são essenciais para todos os alunos?', 'Como a história das constituições reflete as mudanças no Brasil?', 'Qual a importância de ter deveres para garantir direitos?']),
          createLesson('1-3-geo-1', 'Desigualdade e Indicadores Sociais', 'geografia', 'Análise do IDH, desemprego estrutural e a realidade da renda no Tocantins.', 'Raio-X da Renda', 'Pesquisa sobre salários e profissões.', ['Qual a diferença de salário entre a profissão que você deseja e a média nacional?', 'Como a educação influencia na desigualdade de renda?', 'O que o IDH diz sobre a sua cidade?']),
          createLesson('1-3-fil-1', 'Indústria Cultural e Alienação', 'filosofia', 'Como o consumo e a indústria cultural podem alienar o indivíduo.', 'Quanto custa seu look?', 'Cálculo de horas de trabalho necessárias para comprar marcas de luxo.', ['Quantas horas de salário mínimo custa o tênis dos seus sonhos?', 'O consumo define quem você é?', 'O que é alienação para Adorno e Horkheimer?']),
          createLesson('1-3-soc-1', 'Estratificação e Justiça Social', 'sociologia', 'O estudo da distribuição de renda e as classes sociais no Brasil.', 'Orçamento Real', 'Simulação de gestão de um salário mínimo familiar.', ['É possível cobrir moradia, alimentação e lazer com um salário mínimo? Detalhe.', 'O que é estratificação social?', 'Como a justiça social pode diminuir a intolerância?'])
        ]
      },
      {
        id: 4,
        title: "4º Bimestre: Diversidade e Protagonismo",
        lessons: [
          createLesson('1-4-his-1', 'Movimentos Sociais e Equidade', 'historia', 'A luta por direitos étnico-raciais e o papel das comunidades tradicionais no Tocantins.', 'Vozes Locais', 'Produção de mini-relato sobre movimentos culturais.', ['O que você sabe sobre as comunidades quilombolas do Tocantins?', 'Como o movimento hip-hop expressa lutas sociais?', 'Por que a equidade é diferente da igualdade?']),
          createLesson('1-4-geo-1', 'Território e Identidade', 'geografia', 'A territorialização de indígenas e afrodescendentes e o mapeamento de conflitos agrários.', 'Mapa de Conflitos', 'Identificação de áreas de tensão no estado.', ['Por que a terra é central para a identidade de um povo?', 'Quais conflitos de terra existem perto da sua região?', 'Como o mapa ajuda a entender a exclusão social?']),
          createLesson('1-4-fil-1', 'Contrato Social e Inclusão', 'filosofia', 'Teorias de Rousseau e Kant aplicadas à convivência e exclusão social.', 'O Contrato Social da Escola', 'Reescrita de regras sob a ótica da inclusão.', ['Quem é o "excluído" no recreio da sua escola?', 'Como as regras podem garantir que todos sejam respeitados?', 'O que é o estado de natureza para os contratualistas?']),
          createLesson('1-4-soc-1', 'Ações Afirmativas e Cotas', 'sociologia', 'O debate sobre políticas de cotas e a diáspora africana.', 'Debate de Cotas', 'Análise de dados sobre o impacto das cotas no ensino superior.', ['Por que as cotas são consideradas "reparação histórica"?', 'Quais dados justificam a existência de ações afirmativas?', 'Como a diversidade melhora o ambiente universitário?'])
        ]
      }
    ]
  },
  {
    id: 2,
    title: "2ª Série",
    description: "Estado, Política, Tecnologia e Mundo do Trabalho",
    color: "bg-indigo-600",
    bimesters: [
      { 
        id: 1, 
        title: "1º Bimestre: Estado e Revoluções", 
        lessons: [
          createLesson('2-1-his-1', 'Legado do Mundo Antigo e Revoluções', 'historia', 'O impacto das democracias antigas e das revoluções Mexicana e Russa no mundo atual.', 'Revolução no Feed', 'Simule a cobertura de uma revolução histórica em redes sociais.', ['Como seriam os "stories" da Revolução Russa?', 'Quais os principais ideais defendidos nessas revoluções?', 'O que mudou na política mundial após 1917?']),
          createLesson('2-1-geo-1', 'Revolução Industrial e Capitalismo', 'geografia', 'As fases da industrialização e a transformação do espaço produtivo.', 'Linha do Tempo dos Objetos', 'Investigue a evolução produtiva de um objeto (ex: celular).', ['De onde vêm os componentes do seu celular?', 'Como a Indústria 4.0 mudou a forma como consumimos?', 'Qual o impacto ambiental dessa produção em massa?']),
          createLesson('2-1-fil-1', 'Liberalismo e Contrato Social', 'filosofia', 'Estudo de Hobbes, Locke e Rousseau sobre o papel do Estado.', 'Contrato Social da Turma', 'Redação de um acordo coletivo para a convivência escolar.', ['De quais liberdades você abriria mão pela segurança de todos?', 'Qual a função do Estado segundo Locke?', 'O homem é bom por natureza?']),
          createLesson('2-1-soc-1', 'Trabalho e Estratificação na Escola', 'sociologia', 'Relação entre classes sociais, poder e prestígio no ambiente escolar.', 'Pirâmide da Escola', 'Mapeamento da hierarquia social dentro da escola.', ['Quem detém o poder na escola além da direção?', 'Como a estratificação escolar reflete a sociedade?', 'A educação realmente diminui as distâncias entre as classes?'])
        ] 
      },
      { 
        id: 2, 
        title: "2º Bimestre: Tecnologia e Fluxos Globais", 
        lessons: [
          createLesson('2-2-his-1', 'Verdade e Pós-Verdade', 'historia', 'Análise da informação no mundo contemporâneo e movimentos de juventude.', 'Detetives da Pós-Verdade', 'Checagem de fatos em notícias virais.', ['Como identificar uma "fake news"?', 'Por que as pessoas acreditam em mentiras confortáveis?', 'Qual o papel dos jovens nos movimentos de 1968?']),
          createLesson('2-2-geo-1', 'Fluxos Globais e Identidade', 'geografia', 'Zonas de atração populacional e a formação de identidades culturais regionais.', 'Mapeamento Cultural Juvenil', 'Onde os jovens se reúnem na sua cidade?', ['Quais "tribos" urbanas existem em Palmas?', 'Como a internet cria espaços de reunião virtuais?', 'O que define a cultura do Tocantins hoje?']),
          createLesson('2-2-fil-1', 'Modernidade Líquida (Bauman)', 'filosofia', 'A fragilidade das relações e o consumo na obra de Zygmunt Bauman.', 'Diário da Liquidez', 'Registro de interações rápidas vs profundas.', ['Suas amizades em redes sociais são profundas ou "líquidas"?', 'Por que tudo parece descartável hoje em dia?', 'Qual a importância da alteridade (olhar o outro)?']),
          createLesson('2-2-soc-1', 'Bolhas Digitais e Redes Sociais', 'sociologia', 'Como os algoritmos moldam nossa percepção de mundo e criam bolhas culturais.', 'Bolha Digital', 'Comparação de feeds de pessoas com perfis diferentes.', ['Por que seu amigo recebe notícias diferentes das suas no mesmo app?', 'Como sair da bolha digital?', 'As redes sociais unem ou separam as pessoas?'])
        ] 
      },
      {
        id: 3,
        title: "3º Bimestre: Indústria Cultural e Trabalho",
        lessons: [
          createLesson('2-3-his-1', 'Arqueologia da Propaganda', 'historia', 'O papel da propaganda na construção da ideologia capitalista.', 'Arqueologia da Propaganda', 'Análise de anúncios antigos vs atuais.', ['O que a propaganda dos anos 50 dizia sobre o papel da mulher?', 'Como a publicidade vende "felicidade"?', 'As marcas hoje são mais éticas ou apenas mais "verdes"?']),
          createLesson('2-3-geo-1', 'Cadeias Produtivas Globais', 'geografia', 'O caminho dos produtos desde a matéria-prima até o descarte.', 'A Jornada do Produto', 'Rastreie a origem de um eletrônico.', ['Onde foi desenhado, montado e extraído o material do seu computador?', 'O que é a Divisão Internacional do Trabalho?', 'Qual o custo ambiental do transporte global?']),
          createLesson('2-3-fil-1', 'Escola de Frankfurt e Ideologia', 'filosofia', 'Crítica à razão instrumental e a dominação através da cultura de massa.', 'Ideologia na Música', 'Análise das letras das músicas mais tocadas.', ['Quais valores (consumo, ostentação, amor) as músicas atuais reforçam?', 'A música que você ouve é arte ou produto?', 'O que Adorno diria sobre o TikTok?']),
          createLesson('2-3-soc-1', 'Uberização e Precarização', 'sociologia', 'As novas formas de trabalho e a perda de direitos na era digital.', 'Simulação de Orçamento Uberizado', 'Tente fechar o mês com renda variável de entregador.', ['Quais os riscos de trabalhar sem carteira assinada?', 'O que é "uberização"?', 'O lazer é um direito ou um luxo no mundo atual?'])
        ]
      },
      {
        id: 4,
        title: "4º Bimestre: Geopolítica e Ordem Mundial",
        lessons: [
          createLesson('2-4-his-1', 'ONU e Missões de Paz', 'historia', 'A governança global, o Estado de Israel e os desafios diplomáticos.', 'Assembleia de Crise', 'Simulação de solução para um conflito global.', ['Como a ONU tenta evitar guerras?', 'Qual o papel da OMS em uma pandemia?', 'Por que existem conflitos que nunca terminam?']),
          createLesson('2-4-geo-1', 'Blocos Econômicos e Nova Ordem', 'geografia', 'A atuação de organismos como FMI e OMC e a formação de blocos.', 'Jogo dos Blocos', 'Negociação entre países por recursos.', ['Por que países se unem em blocos (como o Mercosul)?', 'Como o dólar influencia a economia do Brasil?', 'O que é o IDH de uma nação?']),
          createLesson('2-4-fil-1', 'Microfísica do Poder (Foucault)', 'filosofia', 'Onde o poder se esconde nas instituições do dia a dia.', 'Microfísica da Escola', 'Identifique centros de poder além da direção.', ['Quem decide a música do recreio?', 'Como o olhar do outro controla nosso comportamento?', 'O conhecimento é uma forma de poder?']),
          createLesson('2-4-soc-1', 'Regimes Políticos e Partidos', 'sociologia', 'Diferença entre democracia, totalitarismo e doutrinas políticas.', 'Criação de Partidos', 'Crie um partido fictício com propostas para a escola.', ['Qual a diferença entre liberalismo e socialismo?', 'O que é anarquismo?', 'Como os partidos representam os cidadãos?'])
        ]
      }
    ]
  },
  {
    id: 3,
    title: "3ª Série",
    description: "Revisão Crítica, Dicotomias e Projeto de Vida",
    color: "bg-purple-600",
    bimesters: [
      { 
        id: 1, 
        title: "1º Bimestre: Dicotomias e Razão", 
        lessons: [
          createLesson('3-1-his-1', 'Espaço Urbano e Rural', 'historia', 'As ambiguidades nos processos históricos e os conflitos pela terra.', 'Debate Cidade vs Campo', 'Desconstrua estereótipos sobre a "roça" e a "cidade".', ['Por que existe preconceito com quem mora no campo?', 'Como a cidade depende do campo para sobreviver?', 'Quais os principais conflitos de terra no Tocantins hoje?']),
          createLesson('3-1-geo-1', 'Urbanização e Agronegócio', 'geografia', 'A conexão entre a produção agropecuária e o êxodo rural.', 'Origens Alimentares', 'Rastreie a origem do lanche da escola.', ['Quanto do seu lanche veio direto da terra?', 'O que é processado e o que é natural?', 'Por que as pessoas continuam saindo do campo para a cidade?']),
          createLesson('3-1-fil-1', 'Lógica e Argumentação', 'filosofia', 'Estudo do silogismo e falácias no discurso político e digital.', 'Detetives da Lógica', 'Encontre erros de raciocínio em falas de influenciadores.', ['O que é uma falácia?', 'Como um argumento pode ser válido mas falso?', 'Por que a lógica é importante para a cidadania?']),
          createLesson('3-1-soc-1', 'Obsolescência e Desenvolvimento', 'sociologia', 'As consequências da modernidade e o descarte tecnológico.', 'Museu da Obsolescência', 'Analise por que eletrônicos antigos foram descartados.', ['Por que seu celular dura menos que a TV dos seus avós?', 'O que é obsolescência programada?', 'Como o lixo eletrônico impacta o meio ambiente?'])
        ] 
      },
      { 
        id: 2, 
        title: "2º Bimestre: Imagem e Território", 
        lessons: [
          createLesson('3-2-his-1', 'Identidade e Movimentos Sociais', 'historia', 'A formação da sociedade brasileira e os movimentos de resistência.', 'História do Bairro', 'Entreviste moradores antigos para reconstruir a história local.', ['Quem foram os fundadores do seu bairro?', 'Como o bairro mudou desde a sua fundação?', 'Quais lutas os moradores enfrentaram por melhorias?']),
          createLesson('3-2-geo-1', 'Cartografia e Linguagem', 'geografia', 'O mapa como recurso de expressão e poder.', 'Mapa Afetivo', 'Crie um mapa com os locais importantes para sua vida.', ['Onde você se sente seguro na sua cidade?', 'Quais lugares trazem memórias ruins?', 'Como o mapa pode esconder ou revelar desigualdades?']),
          createLesson('3-2-fil-1', 'Estética e Redes Sociais', 'filosofia', 'Reflexão sobre a imagem, privacidade e vigilância na era digital.', 'Minha Imagem na Rede', 'Análise crítica do seu próprio perfil social.', ['Sua foto de perfil representa quem você realmente é?', 'O que você esconde nas redes sociais?', 'A beleza é um padrão ou uma construção?']),
          createLesson('3-2-soc-1', 'Algoritmos e Espaço Urbano', 'sociologia', 'Como a tecnologia gere o território e influencia nossas escolhas.', 'Caça ao Algoritmo', 'Compare resultados de busca com colegas.', ['Por que o Google mostra coisas diferentes para pessoas diferentes?', 'Como os algoritmos podem criar "bolhas" geográficas?', 'O Estado consegue controlar a internet?'])
        ] 
      },
      {
        id: 3,
        title: "3º Bimestre: Sustentabilidade e Consumo",
        lessons: [
          createLesson('3-3-his-1', 'História da Poluição e Trabalho', 'historia', 'O histórico da formação dos núcleos urbanos e a legislação de amparo ao trabalho.', 'Diário do Lixo', 'Pese e fotografe seu lixo por uma semana.', ['Quanto lixo você produz individualmente?', 'Como a revolução industrial mudou nossa relação com os resíduos?', 'O que acontece com o lixo da sua cidade?']),
          createLesson('3-3-geo-1', 'Turismo Sustentável no Tocantins', 'geografia', 'Industrialização, impactos ambientais e o potencial do turismo local.', 'Turismo Sustentável no TO', 'Crie um roteiro que valorize a economia local.', ['Como o Jalapão pode ser explorado sem ser destruído?', 'O que é turismo predatório?', 'Como o turismo ajuda as comunidades tradicionais?']),
          createLesson('3-3-fil-1', 'Bioética e Justiça Social', 'filosofia', 'Desafios éticos da manipulação genética e inteligência artificial.', 'Tribunal da Bioética', 'Júri simulado sobre o uso de IA na saúde.', ['A IA deve decidir quem recebe um tratamento médico?', 'Quais os limites da ciência?', 'O que é dignidade humana para Kant?']),
          createLesson('3-3-soc-1', 'Direitos Humanos e Cadeia Produtiva', 'sociologia', 'Investigação de violações de direitos no consumo de marcas famosas.', 'Auditoria de Direitos', 'Pesquise denúncias de trabalho escravo em marcas que você usa.', ['Sua roupa foi feita com trabalho escravo?', 'O que é consumo consciente?', 'Como cobrar responsabilidade das grandes empresas?'])
        ]
      },
      {
        id: 4,
        title: "4º Bimestre: Projeto de Vida e Futuro",
        lessons: [
          createLesson('3-4-his-1', 'História Local e Empreendedorismo', 'historia', 'A juventude nos contextos históricos e as mudanças no mundo do trabalho.', 'Entrevista com o Futuro', 'Fale com um profissional da área que você deseja seguir.', ['Quais são os maiores desafios dessa profissão hoje?', 'Como a tecnologia mudou essa carreira nos últimos 10 anos?', 'O que é necessário para ser um empreendedor ético?']),
          createLesson('3-4-geo-1', 'Novas Profissões no Tocantins', 'geografia', 'Oferta de trabalho, PEA e a desigualdade social na geração de renda.', 'Empreender no Bairro', 'Crie um plano de negócio que resolva um problema real do seu bairro.', ['Falta padaria, reciclagem ou lazer perto da sua casa?', 'Como sua ideia pode gerar empregos?', 'O que é a População Economicamente Ativa (PEA)?']),
          createLesson('3-4-fil-1', 'Autoconhecimento e Psicanálise', 'filosofia', 'Estudo do Id, Ego e Superego aplicados à escolha profissional.', 'Mapa da Mente', 'Dinâmica de autoconhecimento baseada em Freud.', ['O que você quer fazer (Id) vs o que você deve fazer (Superego)?', 'Como equilibrar seus desejos com a realidade (Ego)?', 'Qual sua verdadeira motivação para o futuro?']),
          createLesson('3-4-soc-1', 'Políticas Públicas e Emprego', 'sociologia', 'O impacto das tecnologias nas profissões e as políticas de renda jovem.', 'Feira das Profissões em Extinção', 'Pesquisa sobre cargos que estão sumindo e surgindo.', ['Sua profissão preferida vai existir daqui a 20 anos?', 'O que é um "gestor de tráfego" ou "piloto de drone"?', 'Qual o papel do governo em garantir o primeiro emprego?'])
        ]
      }
    ]
  }
];
