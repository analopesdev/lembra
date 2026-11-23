// RN-04 (com a decisão da usuária): dia válido na sequência. Puro.
export const VALID_SHARE = 0.8;
export const MIN_ACTIVE_SECONDS = 180;
export const MIN_ANSWERS = 10;

export interface DayActivity {
  /** Tamanho do conjunto planejado para o orçamento do dia, fixado na virada (4h, fuso do usuário). */
  readonly planned: number;
  /** Quantos cards desse conjunto já foram feitos. */
  readonly plannedDone: number;
  /** Respostas dadas no dia (qualquer card) e tempo de recordação ativa em segundos. */
  readonly answered: number;
  readonly activeSeconds: number;
}

/** Válido se fez ≥ 80% do conjunto planejado, OU ≥ 3 min de recordação ativa com ≥ 10 respostas. */
export function isValidDay(a: DayActivity): boolean {
  const byPlan = a.planned > 0 && a.plannedDone / a.planned >= VALID_SHARE;
  const byEffort = a.activeSeconds >= MIN_ACTIVE_SECONDS && a.answered >= MIN_ANSWERS;
  return byPlan || byEffort;
}
