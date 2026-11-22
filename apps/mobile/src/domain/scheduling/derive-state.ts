// Estado FSRS derivado do histórico append-only (RN-12, ADR-0007). Funções puras:
// sem relógio, I/O nem aleatoriedade (fuzz sempre desligado). `start` é injetado.
import { createEmptyCard, fsrs, generatorParameters, type Card, type Grade } from "ts-fsrs";

export type Rating = 1 | 2 | 3 | 4;
export type FsrsState = 0 | 1 | 2 | 3; // Novo, Aprendendo, Revisão, Reaprendendo

export interface FsrsParams {
  readonly requestRetention: number;
  readonly maximumInterval: number;
  readonly weights: readonly number[]; // 21 pesos (FSRS-6)
  readonly enableShortTerm: boolean;
}

/** Evento do histórico. `retention` > 0 é a retenção alvo vigente na revisão (RN-05). */
export interface ReviewEvent {
  readonly id: string;
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
  let card = createEmptyCard(start);
  for (const ev of history) card = step(card, ev, params);
  return toCardState(card);
}
