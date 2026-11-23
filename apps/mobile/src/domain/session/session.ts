// RN-02 (dívida) e montagem da sessão (RN-01). Puro.
import { studyDayOf, type StudyDay } from "../study-day/study-day";
import { orderByValue } from "./review-value";

export const DEFAULT_SECONDS_PER_CARD = 15;
export const DEBT_SHARE = 0.3;

/** Quantos cards cabem no tempo escolhido, pelo tempo médio por card do histórico (15 s no início). */
export function sessionCapacity(
  minutes: number,
  avgSecondsPerCard: number = DEFAULT_SECONDS_PER_CARD,
): number {
  if (minutes <= 0 || avgSecondsPerCard <= 0) return 0;
  return Math.floor((minutes * 60) / avgSecondsPerCard);
}

/** No máximo 30% da sessão é reservada para a dívida. */
export function debtSlots(capacity: number): number {
  return Math.floor(capacity * DEBT_SHARE);
}

/** Atrasado = vencimento num dia de estudo anterior ao de hoje (suposição registrada: RN-02 não define "atrasado"). */
export function isOverdue(due: Date, todayStudyDay: StudyDay, timeZone: string): boolean {
  return studyDayOf(due, timeZone) < todayStudyDay;
}

/** Dias até zerar a dívida = dívida ÷ (30% da capacidade diária em cards), arredondado para cima. */
export function daysToClearDebt(debt: number, capacity: number): number {
  if (debt <= 0) return 0;
  const slots = debtSlots(capacity);
  return slots <= 0 ? Number.POSITIVE_INFINITY : Math.ceil(debt / slots);
}

/** Enquanto houver dívida, nenhum card novo entra (RF-31). */
export function newCardsAllowed(debt: number): boolean {
  return debt <= 0;
}

export interface ReviewCandidate {
  readonly id: string;
  /** V = (1 − R) × I × P (RN-01). Cards novos não têm R e não competem por V. */
  readonly value: number;
}

export interface NewCandidate {
  readonly id: string;
  readonly importance: 1 | 2 | 3;
  readonly createdAt: Date;
}

export interface SessionInput {
  /** Revisões que vencem no dia de estudo atual (não são dívida). */
  readonly dueToday: readonly ReviewCandidate[];
  /** Dívida: vencimento em dia de estudo anterior (RN-02). */
  readonly overdue: readonly ReviewCandidate[];
  readonly newCards: readonly NewCandidate[];
  /** Cards que cabem no tempo escolhido (`sessionCapacity`). */
  readonly capacity: number;
  /** Quantos novos ainda podem entrar hoje (limite diário, RF-03). */
  readonly newCardsLeftToday: number;
}

export interface Session {
  readonly dueToday: ReviewCandidate[];
  readonly overdue: ReviewCandidate[];
  readonly newCards: NewCandidate[];
}

/** Ordem de apresentação: vencidas de hoje, depois atrasados, depois novos. */
export function sessionIds(s: Session): string[] {
  return [...s.dueToday, ...s.overdue, ...s.newCards].map((c) => c.id);
}

function newByPriority(cards: readonly NewCandidate[]): NewCandidate[] {
  return [...cards].sort(
    (a, b) =>
      b.importance - a.importance ||
      a.createdAt.getTime() - b.createdAt.getTime() ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}

/**
 * Montagem da sessão (RN-01, RN-02, RF-03, RF-31). Determinística, empates por ID.
 *  a) vencidas de hoje, por V decrescente;
 *  b) atrasados, por V decrescente: no máximo 30% do tempo enquanto restarem revisões de hoje sem caber;
 *     o tempo que sobrar depois de (a) vai para os atrasados;
 *  c) novos só se a dívida for 0, se ainda houver tempo e até o limite diário: importância (3 primeiro),
 *     depois data de criação.
 */
export function buildSession(input: SessionInput): Session {
  const capacity = Math.max(0, Math.floor(input.capacity));
  const today = orderByValue(input.dueToday.map((c) => ({ ...c })));
  const overdue = orderByValue(input.overdue.map((c) => ({ ...c })));

  // Reserva para a dívida: até 30% da sessão, mas nunca mais do que existe de atrasados.
  const reserve = Math.min(debtSlots(capacity), overdue.length);
  const todayTaken = Math.min(today.length, capacity - reserve);
  const overdueTaken = Math.min(overdue.length, capacity - todayTaken);

  const debt = overdue.length; // dívida total, não só a parte que cabe hoje
  let fresh: NewCandidate[] = [];
  if (newCardsAllowed(debt)) {
    const room = Math.max(
      0,
      Math.min(capacity - todayTaken - overdueTaken, Math.floor(input.newCardsLeftToday)),
    );
    fresh = newByPriority(input.newCards).slice(0, room);
  }
  return { dueToday: today.slice(0, todayTaken), overdue: overdue.slice(0, overdueTaken), newCards: fresh };
}
