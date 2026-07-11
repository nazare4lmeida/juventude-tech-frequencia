// =====================================================================
// JUVENTUDE TECH — CONSTANTES E REGRAS DE NEGÓCIO (FRONTEND)
// =====================================================================
// Este arquivo é espelhado em backend/index.js (seção "CRONOGRAMAS
// OFICIAIS"). Sempre que alterar datas/horários AQUI, replique a
// mesma alteração lá — o backend é quem garante a regra de verdade
// (o frontend só usa essas constantes para deixar a tela bonita e
// evitar cliques desnecessários; quem decide se o ponto é aceito é
// sempre o servidor).
// =====================================================================

// Em desenvolvimento local, aponta para o backend rodando na porta 3001.
// Em produção, por padrão assume que frontend e backend estão no MESMO
// domínio (rota /api). Se você optar por hospedar o backend separado
// (ex.: Vercel para o frontend + Render para o backend — recomendado,
// veja DEPLOY.md), defina a variável de ambiente VITE_API_URL no painel
// do seu provedor de frontend com a URL completa do backend, por
// exemplo: VITE_API_URL=https://seu-backend.onrender.com/api
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:3001/api"
    : "/api");

// IDs devem bater exatamente com o campo `formacao` salvo no banco
export const FORMACOES = [
  {
    id: "fullstack",
    nome: "Programação Full Stack",
    tag: "FS",
    cor: "#2a3fae",
    horas: "192h",
  },
  {
    id: "ia-gen",
    nome: "Inteligência Artificial",
    tag: "IA",
    cor: "#3882ff",
    horas: "96h",
  },
  {
    id: "mkt-dig",
    nome: "Marketing Digital",
    tag: "MKT",
    cor: "#15215e",
    horas: "192h",
  },
];

// =====================================================================
// 🧪 MODO DE TESTE LOCAL — JANELA DE CHECK-IN/CHECK-OUT
// Use isso pra testar o fluxo de presença sem esperar o sábado de manhã.
//
//   "WINDOW_OPEN"  → ignora dia/horário: check-in e check-out ficam
//                     sempre liberados na TELA, não importa quando
//                     você estiver testando.
//   "WINDOW_CLOSE" → comportamento normal (padrão) — vale o cronograma
//                     e o horário reais de cada curso.
//
// ⚠️ Isso só afeta o FRONTEND (deixa os botões clicáveis). O backend
// valida de novo e tem seu próprio interruptor, controlado por uma
// variável de ambiente — veja "FORCAR_JANELA_ABERTA" em backend/.env
// e o comentário equivalente em backend/index.js. Pra testar o
// check-in de ponta a ponta localmente, os dois precisam estar
// "abertos" ao mesmo tempo.
//
// Sempre volte para "WINDOW_CLOSE" aqui antes de commitar/subir para
// produção — em produção (npm run build), deixe sempre assim.
// =====================================================================
export const MODO_JANELA = "WINDOW_OPEN";
// 🧪 MODO TESTE — liberado até encerrar os testes de hoje.
// Antes de subir para produção, volte para: "WINDOW_CLOSE"

// =====================================================================
// CRONOGRAMA OFICIAL DOS AULÕES (SOMENTE SÁBADOS)
// Fonte: planilha "Cronograma_Juventude_Tech_2026.xlsx" (abas
// "ONLINE - Full Stack", "ONLINE - MKT digital", "ONLINE - IA GEN").
//
// IMPORTANTE: a presença SÓ é registrada aos sábados (dia do "AULÃO"
// ao vivo). De segunda a sexta o conteúdo é assíncrono pelo Moodle e
// não passa por este sistema.
//
// 15/08/2026 é feriado em todos os cursos — por isso não tem aulão
// nessa data em nenhuma trilha.
// =====================================================================
export const CRONOGRAMAS = {
  fullstack: [
    "2026-07-04",
    "2026-07-11",
    "2026-07-18",
    "2026-07-25",
    "2026-08-01",
    "2026-08-08",
    "2026-08-22",
    "2026-08-29",
  ],
  "mkt-dig": [
    "2026-07-04",
    "2026-07-11",
    "2026-07-18",
    "2026-07-25",
    "2026-08-01",
    "2026-08-08",
    "2026-08-22",
    // ⚠️ ATENÇÃO: a planilha original registrava "28/08" para este
    // aulão, mas 28/08/2026 cai numa SEXTA-feira (todas as outras
    // linhas da planilha caem sempre no sábado). Interpretamos como
    // erro de digitação e corrigimos para o sábado correspondente,
    // 29/08/2026. Se a data pretendida for outra, ajuste a linha
    // abaixo (e o espelho em backend/index.js).
    "2026-08-29",
  ],
  "ia-gen": [
    "2026-07-04",
    "2026-07-11",
    "2026-07-18",
    "2026-07-25",
    "2026-08-01",
    "2026-08-08",
  ],
};

// =====================================================================
// HORÁRIO DOS AULÕES DE SÁBADO
// Defina aqui o horário oficial de início/fim de cada curso. Por
// padrão os 3 cursos usam o mesmo horário (manhã, 08:00–12:00) —
// se cada turma tiver um horário próprio no futuro, basta editar o
// valor correspondente abaixo.
// =====================================================================
export const HORARIOS_AULAO = {
  fullstack: { inicio: "08:00", fim: "12:00" },
  "ia-gen": { inicio: "08:00", fim: "12:00" },
  "mkt-dig": { inicio: "08:00", fim: "12:00" },
};

// Tolerância (em minutos) ao redor do horário oficial em que a janela
// de check-in/check-out fica aberta. Ex.: com 15/30, o check-in do
// curso que começa às 08:00 libera às 07:45 e fecha às 08:30.
export const TOLERANCIA_ANTES_MIN = 15;
export const TOLERANCIA_DEPOIS_MIN = 50;

// =====================================================================
// TEMAS DOS AULÕES (para exibir nas telas de aluno/admin)
// =====================================================================
export const TEMAS_AULOES = {
  fullstack: {
    "2026-07-04": "Módulo 01 — Programação Front-End (HTML & CSS)",
    "2026-07-11": "Módulo 01 — Programação Front-End (HTML & CSS)",
    "2026-07-18": "Módulo 01 — Programação Front-End (HTML & CSS)",
    "2026-07-25": "Módulo 02 — Front-End em JavaScript",
    "2026-08-01": "Módulo 02 — Front-End em JavaScript",
    "2026-08-08": "Módulo 02 — Front-End em JavaScript",
    "2026-08-22": "Módulo 03 — Desenvolvendo Back-End",
    "2026-08-29": "Módulo 03 — Desenvolvendo Back-End",
  },
  "mkt-dig": {
    "2026-07-04": "Planejamento de Marketing",
    "2026-07-11": "Planejamento de Marketing",
    "2026-07-18": "Planejamento de Conteúdo",
    "2026-07-25": "Planejamento de Conteúdo",
    "2026-08-01": "Design e Web Branding",
    "2026-08-08": "Conteúdo Estático, Formatos e Design (Canva)",
    "2026-08-22": "Meta Ads",
    "2026-08-29": "Google Ads",
  },
  "ia-gen": {
    "2026-07-04": "Módulo 01 — Fundamentos, APIs e IA Generativa",
    "2026-07-11": "Módulo 02 — Embeddings, Vetorização e RAG",
    "2026-07-18": "Módulo 03 — Workflows e Data Lake",
    "2026-07-25": "Módulo 03 — Workflows e Data Lake",
    "2026-08-01": "Módulo 04 — Multiagentes de IA Generativa",
    "2026-08-08": "Módulo 04 — Multiagentes de IA Generativa",
  },
};

// =====================================================================
// HELPERS
// =====================================================================

export const getNomeFormacao = (id) =>
  FORMACOES.find((f) => f.id === id)?.nome || "Não informada";

export const getFormacao = (id) => FORMACOES.find((f) => f.id === id) || null;

export const getHorarioAulao = (formacaoId) =>
  HORARIOS_AULAO[formacaoId] || HORARIOS_AULAO.fullstack;

const horaParaDecimal = (hhmm) => {
  const [h, m] = (hhmm || "0:0").split(":").map(Number);
  return h + (m || 0) / 60;
};

// Datas de aulão cujo horário de término já passou (conta como "aula
// que já ocorreu" para fins de cálculo de frequência/faltas).
export const obterDatasOcorridas = (formacaoId) => {
  const agora = new Date();
  const datas = CRONOGRAMAS[formacaoId] || [];
  const { inicio } = getHorarioAulao(formacaoId);
  return datas.filter((d) => new Date(`${d}T${inicio}:00`) <= agora);
};

export const obterAulasOcorridas = (formacaoId) =>
  obterDatasOcorridas(formacaoId).length;

export const obterProximasAulas = (formacaoId) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const datas = CRONOGRAMAS[formacaoId] || [];
  return datas.filter((d) => new Date(d + "T12:00:00") >= hoje).slice(0, 5);
};

export const formatarDataBR = (isoDate) => {
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}/${ano}`;
};

// Avalia, para a formação informada, se HOJE é dia de aulão e se o
// check-in/check-out estão dentro da janela liberada agora mesmo.
// `agora` pode ser injetado (testes); por padrão usa o relógio local.
export const avaliarJanelaPonto = (formacaoId, agora = new Date()) => {
  const hojeISO = agora.toLocaleDateString("en-CA"); // YYYY-MM-DD (fuso local)

  // 🧪 Modo de teste local: força tudo liberado, ignorando dia/horário.
  if (MODO_JANELA === "WINDOW_OPEN") {
    return {
      ehDiaDeAulao: true,
      podeCheckIn: true,
      podeCheckOut: true,
      horarioInicio: getHorarioAulao(formacaoId).inicio,
      horarioFim: getHorarioAulao(formacaoId).fim,
      tema: TEMAS_AULOES[formacaoId]?.[hojeISO] || null,
    };
  }

  const horaDecimal = agora.getHours() + agora.getMinutes() / 60;

  const datasValidas = CRONOGRAMAS[formacaoId] || [];
  const ehDiaDeAulao = datasValidas.includes(hojeISO);

  const { inicio, fim } = getHorarioAulao(formacaoId);
  const inicioDec = horaParaDecimal(inicio);
  const fimDec = horaParaDecimal(fim);
  const antes = TOLERANCIA_ANTES_MIN / 60;
  const depois = TOLERANCIA_DEPOIS_MIN / 60;

  const podeCheckIn =
    ehDiaDeAulao &&
    horaDecimal >= inicioDec - antes &&
    horaDecimal <= inicioDec + depois;
  const podeCheckOut =
    ehDiaDeAulao &&
    horaDecimal >= fimDec - antes &&
    horaDecimal <= fimDec + depois;

  return {
    ehDiaDeAulao,
    podeCheckIn,
    podeCheckOut,
    horarioInicio: inicio,
    horarioFim: fim,
    tema: TEMAS_AULOES[formacaoId]?.[hojeISO] || null,
  };
};
