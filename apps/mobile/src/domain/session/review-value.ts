// RN-01: valor da revisão V = (1 − R) × I × P e ordem estável da sessão. Pura.
export type Importance = 1 | 2 | 3;

const IMPORTANCE_WEIGHT: Record<Importance, number> = { 1: 1.0, 2: 1.5, 3: 2.0 };

/** Peso da prova: 1 + (30 − d)/30 quando faltam 0 ≤ d ≤ 30 dias; senão 1. */
export function examWeight(daysToExam: number | null): number {
  if (daysToExam === null || daysToExam < 0 || daysToExam > 30) return 1;
  return 1 + (30 - daysToExam) / 30;
}

export function reviewValue(
  retrievability: number,
  importance: Importance,
  daysToExam: number | null,
): number {
  const r = Math.min(1, Math.max(0, retrievability));
  return (1 - r) * IMPORTANCE_WEIGHT[importance] * examWeight(daysToExam);
}

export interface Valued {
  readonly id: string;
  readonly value: number;
}

/** Ordem decrescente de V; empates resolvidos por ID (ordem estável). */
export function orderByValue<T extends Valued>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => b.value - a.value || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
