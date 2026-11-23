// RN-04 (com a decisão da usuária): dia válido na sequência. Puro.
export const VALID_SHARE = 0.8;
export const MIN_ACTIVE_SECONDS = 180;
export const MIN_ANSWERS = 10;

export interface DayActivity {
  /** Tamanho do conjunto planejado para o orçamento do dia, fixado na virada (4h, fuso do usuário). */
  readonly planned: number;
  /** Quantos cards desse conjunto já foram feitos. */
  readonly plannedDone: number;
  /**
   * Respostas da SESSÃO DE REVISÃO no dia, inclusive repetições na sessão (`in_session_retry`).
   * Respostas de quiz NÃO contam (RN-09): o chamador não deve incluí-las.
   */
  readonly answered: number;
  /** Tempo de recordação ativa em segundos. */
  readonly activeSeconds: number;
}

/**
 * valid: conta na sequência · invalid: quebra (ou gasta congelamento) · neutral: plano vazio e sem estudo,
 * não quebra a sequência, não consome congelamento e não incrementa o contador.
 */
export type DayStatus = "valid" | "invalid" | "neutral";

export function dayStatus(a: DayActivity): DayStatus {
  const byEffort = a.activeSeconds >= MIN_ACTIVE_SECONDS && a.answered >= MIN_ANSWERS;
  if (a.planned <= 0) return byEffort ? "valid" : "neutral";
  return a.plannedDone / a.planned >= VALID_SHARE || byEffort ? "valid" : "invalid";
}
