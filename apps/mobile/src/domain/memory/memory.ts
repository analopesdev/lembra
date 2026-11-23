// RN-06: memória retida = cards ativos com R ≥ 90% agora. Pura.
// No FSRS, R(t = S) = 90%, então R ≥ 90% equivale a `agora ≤ última revisão + S dias`.
// É o que o cache `retained_until` guarda (ADR-0032).
const DAY_MS = 86_400_000;

export interface RetentionInput {
  readonly stability: number;
  readonly lastReview: Date | null;
}

export function retainedUntilMs(s: RetentionInput): number | null {
  return s.lastReview === null || s.stability <= 0 ? null : s.lastReview.getTime() + s.stability * DAY_MS;
}

export function isRetained(s: RetentionInput, now: Date): boolean {
  const until = retainedUntilMs(s);
  return until !== null && now.getTime() <= until;
}

/** Quantos cards têm R ≥ 90% agora. O chamador passa só ativos (suspensos, excluídos e rascunhos não contam). */
export function memoryRetained(states: readonly RetentionInput[], now: Date): number {
  let n = 0;
  for (const s of states) if (isRetained(s, now)) n++;
  return n;
}
