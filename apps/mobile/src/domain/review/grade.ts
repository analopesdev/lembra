import type { Rating } from "../scheduling";

export interface GradeResult {
  readonly rating: Rating;
  readonly coverage: number;
}

export interface AnswerGrader {
  grade(answer: string, expected: string, elapsedSeconds: number): GradeResult;
}

export const FAST_ANSWER_SECONDS = 10;
export const SLOW_ANSWER_SECONDS = 30;

const STOPWORDS = new Set([
  "a",
  "o",
  "as",
  "os",
  "um",
  "uma",
  "de",
  "do",
  "da",
  "dos",
  "das",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "e",
  "ou",
  "que",
  "por",
  "para",
  "com",
  "se",
  "ao",
  "aos",
  "ser",
  "foi",
  "eh",
]);

export function normalize(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOPWORDS.has(w));
}

function stem(word: string): string {
  return word.length > 5 ? word.slice(0, 5) : word;
}

export function coverageOf(answer: string, expected: string): number {
  const wanted = new Set(normalize(expected).map(stem));
  if (wanted.size === 0) return 0;
  const given = new Set(normalize(answer).map(stem));
  let hit = 0;
  for (const w of wanted) if (given.has(w)) hit += 1;
  return hit / wanted.size;
}

export function gradeByCoverage(coverage: number, elapsedSeconds: number): Rating {
  if (coverage < 0.3) return 1;
  if (coverage < 0.6) return 2;
  if (coverage >= 0.85 && elapsedSeconds <= FAST_ANSWER_SECONDS) return 4;
  if (coverage >= 0.85 && elapsedSeconds > SLOW_ANSWER_SECONDS) return 2;
  return 3;
}

export const provisionalGrader: AnswerGrader = {
  grade(answer, expected, elapsedSeconds) {
    const coverage = coverageOf(answer, expected);
    return { rating: gradeByCoverage(coverage, elapsedSeconds), coverage };
  },
};
