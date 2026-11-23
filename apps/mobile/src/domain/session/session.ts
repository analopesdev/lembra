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

export interface Candidate {
  readonly id: string;
  readonly value: number;
  readonly overdue: boolean;
}

/**
 * Escolhe os cards da sessão: ordem decrescente de V (empate por ID), até a capacidade; os atrasados
 * ocupam no máximo 30% das vagas, sempre os de maior V primeiro. Determinística.
 */
export function buildSession<T extends Candidate>(candidates: readonly T[], capacity: number): T[] {
  const maxDebt = debtSlots(capacity);
  const chosen: T[] = [];
  let debtTaken = 0;
  for (const c of orderByValue(candidates)) {
    if (chosen.length >= capacity) break;
    if (c.overdue) {
      if (debtTaken >= maxDebt) continue;
      debtTaken++;
    }
    chosen.push(c);
  }
  return chosen;
}
