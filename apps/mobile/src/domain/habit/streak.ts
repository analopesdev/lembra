// RF-37, RF-38, RN-04: sequência de dias válidos com congelamentos automáticos. Pura.
// O servidor é a fonte da verdade da sequência (RN-13); o app calcula a mesma regra para exibir offline.
import { addDays, diffDays, isoWeekday, type StudyDay } from "../study-day/study-day";
import type { DayStatus } from "./valid-day";

export const FREEZES_PER_WEEK = 2;

export interface StreakInput {
  /** Status de cada dia de estudo já fechado. Dia sem registro = sem estudo (`invalid`). */
  readonly days: Readonly<Record<StudyDay, DayStatus>>;
  readonly today: StudyDay;
  /** Dias de folga planejados, como dia da semana ISO (1 = segunda … 7 = domingo). */
  readonly offWeekdays: readonly number[];
}

export interface StreakResult {
  readonly streak: number;
  /** Congelamentos que ainda restam na semana de `today` (segunda a domingo). */
  readonly freezesLeftThisWeek: number;
}

const weekKey = (day: StudyDay): StudyDay => addDays(day, -(isoWeekday(day) - 1));

/**
 * Simula do primeiro dia registrado até ontem:
 *  - valid: +1 · neutral: não muda nada · invalid: gasta um congelamento da semana (se houver) ou zera.
 *  - dia de folga planejado: não quebra e não gasta congelamento (se estudou e foi válido, conta).
 * Hoje só entra se já for válido; se ainda não, está pendente e nada se quebra.
 */
export function computeStreak(input: StreakInput): StreakResult {
  const recorded = Object.keys(input.days).sort();
  const first = recorded[0];
  const used: Record<string, number> = {};
  let streak = 0;

  if (first !== undefined && first <= input.today) {
    const total = diffDays(first, input.today);
    for (let i = 0; i <= total; i++) {
      const day = addDays(first, i);
      const status: DayStatus = input.days[day] ?? "invalid";
      const isToday = day === input.today;
      if (status === "valid") {
        streak++;
      } else if (isToday || status === "neutral") {
        continue; // hoje pendente ou dia neutro
      } else if (input.offWeekdays.includes(isoWeekday(day))) {
        continue; // folga planejada
      } else {
        const wk = weekKey(day);
        if ((used[wk] ?? 0) < FREEZES_PER_WEEK) used[wk] = (used[wk] ?? 0) + 1;
        else streak = 0;
      }
    }
  }
  return { streak, freezesLeftThisWeek: FREEZES_PER_WEEK - (used[weekKey(input.today)] ?? 0) };
}
