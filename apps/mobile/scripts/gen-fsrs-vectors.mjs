// Gera contracts/fsrs-vectors/vectors.v1.json usando o ts-fsrs diretamente (referência).
// Determinístico: mesma entrada → mesmo arquivo. Os dois lados (ts-fsrs e go-fsrs) rodam estes
// vetores no CI (ADR-0006). Regerar só ao atualizar a versão das bibliotecas, com revisão do diff.
import { writeFileSync } from "node:fs";
import { createEmptyCard, default_w, fsrs, generatorParameters } from "ts-fsrs";

const OUT = new URL("../../../contracts/fsrs-vectors/vectors.v1.json", import.meta.url);
const T0 = Date.UTC(2026, 0, 5, 7, 0, 0); // 2026-01-05T07:00:00Z
const MIN = 60_000;
const DAY = 86_400_000;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ADR-0031: aprendizado em passos desligado (enable_short_term=false) em todos os conjuntos.
const PARAM_SETS = {
  padrao: { request_retention: 0.9, maximum_interval: 36500, enable_short_term: false },
  r85: { request_retention: 0.85, maximum_interval: 36500, enable_short_term: false },
  r95: { request_retention: 0.95, maximum_interval: 36500, enable_short_term: false },
  "max-365": { request_retention: 0.9, maximum_interval: 365, enable_short_term: false },
};

// Pesos alternativos (simulam saída do otimizador, RF-32): perturbação determinística dos padrão.
const altW = default_w.map((w, i) => Number((w * (1 + ((i % 5) - 2) * 0.03)).toFixed(6)));

function iso(ms) {
  return new Date(ms).toISOString();
}

function run(paramName, reviews, w) {
  const base = PARAM_SETS[paramName];
  let card = createEmptyCard(new Date(reviews[0].at));
  const expected = [];
  for (const r of reviews) {
    if (r.kind === "in_session_retry") {
      expected.push({ ...expected[expected.length - 1] }); // fora da derivação: estado inalterado
      continue;
    }
    const params = generatorParameters({
      ...base,
      ...(r.retention ? { request_retention: r.retention } : {}),
      ...(w ? { w } : {}),
      enable_fuzz: false,
    });
    const out = fsrs(params).next(card, new Date(r.at), r.rating);
    card = out.card;
    expected.push({
      due: iso(card.due.getTime()),
      stability: card.stability,
      difficulty: card.difficulty,
      state: card.state,
      reps: card.reps,
      lapses: card.lapses,
      scheduled_days: card.scheduled_days,
      last_review: iso(card.last_review.getTime()),
    });
  }
  return expected;
}

const cases = [];
function add(name, paramName, reviews, w) {
  const entry = {
    name,
    params: paramName,
    reviews: reviews.map((r) => ({
      at: iso(r.at),
      rating: r.rating,
      ...(r.kind ? { kind: r.kind } : {}),
      ...(r.retention ? { retention: r.retention } : {}),
    })),
  };
  if (w) entry.weights = w;
  entry.expected = run(
    paramName,
    reviews.map((r) => ({ ...r, at: r.at })),
    w,
  );
  cases.push(entry);
}

// Sequência a partir de (rating, intervalo em ms desde a revisão anterior).
function seq(steps, start = T0) {
  let t = start;
  return steps.map(([rating, gap], i) => {
    if (i > 0) t += gap;
    return { at: t, rating };
  });
}

// --- Casos escritos à mão (bordas) ---
for (const p of Object.keys(PARAM_SETS)) {
  add(`${p}/primeira-revisao-cada-nota-1`, p, seq([[1, 0]]));
  add(`${p}/primeira-revisao-cada-nota-2`, p, seq([[2, 0]]));
  add(`${p}/primeira-revisao-cada-nota-3`, p, seq([[3, 0]]));
  add(`${p}/primeira-revisao-cada-nota-4`, p, seq([[4, 0]]));
  add(
    `${p}/tudo-bom-no-prazo`,
    p,
    seq([
      [3, 0],
      [3, 1 * DAY],
      [3, 3 * DAY],
      [3, 8 * DAY],
      [3, 20 * DAY],
      [3, 50 * DAY],
    ]),
  );
  add(
    `${p}/tudo-facil`,
    p,
    seq([
      [4, 0],
      [4, 5 * DAY],
      [4, 15 * DAY],
      [4, 60 * DAY],
      [4, 200 * DAY],
    ]),
  );
  add(
    `${p}/tudo-de-novo`,
    p,
    seq([
      [1, 0],
      [1, 10 * MIN],
      [1, 1 * DAY],
      [1, 1 * DAY],
      [1, 2 * DAY],
    ]),
  );
  add(
    `${p}/lapso-e-recuperacao`,
    p,
    seq([
      [3, 0],
      [3, 1 * DAY],
      [3, 4 * DAY],
      [1, 10 * DAY],
      [3, 10 * MIN],
      [3, 2 * DAY],
      [3, 6 * DAY],
    ]),
  );
  add(
    `${p}/dificil-repetido`,
    p,
    seq([
      [2, 0],
      [2, 1 * DAY],
      [2, 2 * DAY],
      [2, 3 * DAY],
      [3, 5 * DAY],
    ]),
  );
  add(
    `${p}/atraso-de-um-ano`,
    p,
    seq([
      [3, 0],
      [3, 2 * DAY],
      [3, 365 * DAY],
      [3, 400 * DAY],
    ]),
  );
  add(
    `${p}/mesmo-instante-duas-vezes`,
    p,
    seq([
      [3, 0],
      [3, 0],
      [3, 0],
    ]),
  );
  add(
    `${p}/revisao-antes-da-hora-minutos`,
    p,
    seq([
      [3, 0],
      [3, 3 * MIN],
      [3, 30 * MIN],
      [4, 2 * 60 * MIN],
    ]),
  );
  add(
    `${p}/virada-de-dia-utc`,
    p,
    seq(
      [
        [3, 0],
        [3, 16 * 60 * MIN + 59 * MIN],
        [3, 23 * 60 * MIN + 59 * MIN],
      ],
      Date.UTC(2026, 2, 28, 23, 0, 0),
    ),
  );
}
// Retenção que muda entre revisões (modo prova, RN-05 x RN-12).
add(
  "retencao-por-revisao/prova-chegando",
  "padrao",
  seq([
    [3, 0],
    [3, 2 * DAY],
    [3, 6 * DAY],
    [3, 14 * DAY],
    [3, 20 * DAY],
  ]).map((r, i) => ({ ...r, retention: [0.85, 0.85, 0.9, 0.95, 0.9][i] })),
);
add(
  "retencao-por-revisao/prova-chegando-curto",
  "padrao",
  seq([
    [3, 0],
    [3, 2 * DAY],
    [2, 6 * DAY],
    [3, 14 * DAY],
  ]).map((r, i) => ({ ...r, retention: [0.85, 0.9, 0.95, 0.9][i] })),
);
// Pesos otimizados (RF-32).
add(
  "pesos-alternativos/bom",
  "padrao",
  seq([
    [3, 0],
    [3, 1 * DAY],
    [3, 4 * DAY],
    [2, 9 * DAY],
    [3, 12 * DAY],
  ]),
  altW,
);
add(
  "pesos-alternativos/curto",
  "padrao",
  seq([
    [1, 0],
    [3, 10 * MIN],
    [3, 1 * DAY],
    [4, 3 * DAY],
  ]),
  altW,
);

// Repetição na sessão (ADR-0031): errou → volta no fim da sessão; a nova resposta só entra no histórico.
add("repeticao-na-sessao/erro-e-retry", "padrao", [
  { at: T0, rating: 3 },
  { at: T0 + 2 * DAY, rating: 1 },
  { at: T0 + 2 * DAY + 10 * MIN, rating: 3, kind: "in_session_retry" },
  { at: T0 + 2 * DAY + 20 * MIN, rating: 1, kind: "in_session_retry" },
  { at: T0 + 5 * DAY, rating: 3 },
]);

// --- Sequências pseudoaleatórias fixas (seed no nome; os dados ficam no arquivo) ---
const RATING_WEIGHTS = [0.12, 0.13, 0.55, 0.2];
function pickRating(rnd) {
  let x = rnd();
  for (let i = 0; i < 4; i++) {
    if ((x -= RATING_WEIGHTS[i]) < 0) return i + 1;
  }
  return 3;
}
const GAPS = [10 * MIN, 1 * DAY, 2 * DAY, 3 * DAY, 7 * DAY, 15 * DAY, 30 * DAY, 90 * DAY, 400 * DAY];
let seed = 1;
for (const p of Object.keys(PARAM_SETS)) {
  for (let n = 0; n < 8; n++, seed++) {
    const rnd = mulberry32(seed);
    const len = [5, 12, 30, 60, 100, 150, 200, 300][n];
    const steps = [];
    for (let i = 0; i < len; i++) {
      steps.push([pickRating(rnd), GAPS[Math.floor(rnd() * GAPS.length)] + Math.floor(rnd() * 3 * 60 * MIN)]);
    }
    add(`${p}/aleatorio-seed${seed}-n${len}`, p, seq(steps));
  }
}

const doc = {
  version: 1,
  description:
    "Vetores de conformidade FSRS (ADR-0006). Gerado por apps/mobile/scripts/gen-fsrs-vectors.mjs com ts-fsrs. Fuzz desligado.",
  library: "ts-fsrs",
  tolerance: { float: 1e-6 },
  default_weights: [...default_w],
  params: PARAM_SETS,
  cases,
};
writeFileSync(OUT, JSON.stringify(doc, null, 1) + "\n");
console.log(
  `${cases.length} casos, ${cases.reduce((a, c) => a + c.reviews.length, 0)} revisões → ${OUT.pathname}`,
);
