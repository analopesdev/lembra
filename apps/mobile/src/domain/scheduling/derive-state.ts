// Estado FSRS derivado do histórico append-only (RN-12, ADR-0007). Funções puras:
// sem relógio, I/O nem aleatoriedade (fuzz sempre desligado). `start` é injetado.
import { fsrs, generatorParameters, type Card, type Grade } from "ts-fsrs";

export type Rating = 1 | 2 | 3 | 4;
export type FsrsState = 0 | 1 | 2 | 3; // Novo, Aprendendo, Revisão, Reaprendendo

export interface FsrsParams {
  readonly requestRetention: number;
  readonly maximumInterval: number;
  readonly weights: readonly number[]; // 21 pesos (FSRS-6)
  readonly enableShortTerm: boolean;
}

/** Evento do histórico. `retention` > 0 é a retenção alvo vigente na revisão (RN-05). */
/** Tipo do evento no revlog (ADR-0031). `in_session_retry` NÃO entra na derivação do estado FSRS. */
export type ReviewKind = "review" | "in_session_retry";

export interface ReviewEvent {
  readonly id: string;
  readonly kind?: ReviewKind;
  readonly at: Date;
  readonly rating: Rating;
  readonly retention?: number;
}

export interface CardState {
  readonly due: Date;
  readonly lastReview: Date | null;
  readonly stability: number;
  readonly difficulty: number;
  readonly state: FsrsState;
  readonly reps: number;
  readonly lapses: number;
  readonly scheduledDays: number;
}

/** Ordem canônica do histórico: por instante e, em empate, por ID (ordem estável, RN-01/RN-12). */
export function sortHistory(history: readonly ReviewEvent[]): ReviewEvent[] {
  return [...history].sort(
    (a, b) => a.at.getTime() - b.at.getTime() || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}

function toCardState(card: Card): CardState {
  return {
    due: card.due,
    lastReview: card.last_review ?? null,
    stability: card.stability,
    difficulty: card.difficulty,
    state: card.state as FsrsState,
    reps: card.reps,
    lapses: card.lapses,
    scheduledDays: card.scheduled_days,
  };
}

function toCard(s: CardState): Card {
  return {
    due: s.due,
    stability: s.stability,
    difficulty: s.difficulty,
    scheduled_days: s.scheduledDays,
    learning_steps: 0, // sem aprendizado em passos (ADR-0031)
    reps: s.reps,
    lapses: s.lapses,
    state: s.state,
    ...(s.lastReview ? { last_review: s.lastReview } : {}),
  };
}

/** Aplica uma revisão sobre o card interno do ts-fsrs. */
function step(card: Card, ev: ReviewEvent, p: FsrsParams): Card {
  const params = generatorParameters({
    request_retention: ev.retention && ev.retention > 0 ? ev.retention : p.requestRetention,
    maximum_interval: p.maximumInterval,
    w: [...p.weights],
    enable_fuzz: false,
    enable_short_term: p.enableShortTerm,
  });
  return fsrs(params).next(card, ev.at, ev.rating as Grade).card;
}

/**
 * Estado do card = função pura do histórico ordenado + parâmetros.
 * O histórico deve vir em ordem canônica (use `sortHistory`). Vazio → card novo vencendo em `start`.
 */
export function deriveState(history: readonly ReviewEvent[], params: FsrsParams, start: Date): CardState {
  return history.reduce((state, ev) => applyReview(state, ev, params), initialState(start));
}

/**
 * Aplica UMA revisão ao estado (recálculo incremental, ADR-0007). Mesma função usada por `deriveState`:
 * só existe um caminho de cálculo. `in_session_retry` não altera o estado (ADR-0031).
 */
export function applyReview(state: CardState, ev: ReviewEvent, params: FsrsParams): CardState {
  if (ev.kind === "in_session_retry") return state;
  return toCardState(step(toCard(state), ev, params));
}

/** Estado de um card que nunca foi revisado, vencendo em `now` (injetado). */
export function initialState(now: Date): CardState {
  return {
    due: now,
    lastReview: null,
    stability: 0,
    difficulty: 0,
    state: 0,
    reps: 0,
    lapses: 0,
    scheduledDays: 0,
  };
}

/**
 * Chance de lembrar agora (R), pela curva de esquecimento do FSRS-6. Card novo (S = 0) → 0.
 * Mesma fórmula do ts-fsrs, para a tela Hoje poder calcular sem instanciar o agendador.
 */
export function retrievability(state: CardState, now: Date, weights: readonly number[]): number {
  if (state.lastReview === null || state.stability <= 0) return 0;
  const decay = -(weights[20] ?? 0.1542);
  const factor = Math.exp(Math.log(0.9) / decay) - 1;
  const elapsedDays = Math.max(0, (now.getTime() - state.lastReview.getTime()) / 86_400_000);
  return Math.pow(1 + (factor * elapsedDays) / state.stability, decay);
}
