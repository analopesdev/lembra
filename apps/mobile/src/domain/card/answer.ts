import type { Rating } from "../scheduling";

export const SLOW_ANSWER_MS = 20_000;
export const FAST_ANSWER_MS = 5_000;
export const STABLE_INTERVAL_DAYS = 21;

const DONT_KNOW = new Set(["", "nao sei", "n sei", "sei la", "nao lembro", "?", "??", "-"]);

export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .trim()
    .replace(/[.,;:!?]+$/u, "")
    .trim();
}

export type AnswerCheck =
  | { readonly result: "blank"; readonly suggested: Rating }
  | { readonly result: "exact"; readonly suggested: Rating }
  | { readonly result: "different"; readonly suggested: null };

export interface AnswerInput {
  readonly typed: string;
  readonly expected: string;
  readonly elapsedMs: number;
  readonly scheduledDays: number;
}

export function checkTypedAnswer({ typed, expected, elapsedMs, scheduledDays }: AnswerInput): AnswerCheck {
  const given = normalizeAnswer(typed);
  if (DONT_KNOW.has(given)) return { result: "blank", suggested: 1 };
  if (given !== normalizeAnswer(expected)) return { result: "different", suggested: null };
  if (elapsedMs > SLOW_ANSWER_MS) return { result: "exact", suggested: 2 };
  if (elapsedMs < FAST_ANSWER_MS && scheduledDays > STABLE_INTERVAL_DAYS) {
    return { result: "exact", suggested: 4 };
  }
  return { result: "exact", suggested: 3 };
}
