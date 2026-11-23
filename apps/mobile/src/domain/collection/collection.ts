import { diffDays, type StudyDay } from "../study-day/study-day";

export const MAX_NAME_LENGTH = 60;

export type NameError = "empty" | "too_long";
export type ExamDateError = "invalid" | "past";

export function validateName(raw: string): { ok: true; name: string } | { ok: false; error: NameError } {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length === 0) return { ok: false, error: "empty" };
  if (name.length > MAX_NAME_LENGTH) return { ok: false, error: "too_long" };
  return { ok: true, name };
}

function isRealDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || y < 1900 || y > 2200) return false;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return d <= (days[m - 1] ?? 0);
}

export function parseExamDate(
  raw: string,
  today: StudyDay,
): { ok: true; day: StudyDay | null } | { ok: false; error: ExamDateError } {
  const text = raw.trim();
  if (text === "") return { ok: true, day: null };
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (!m) return { ok: false, error: "invalid" };
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (!isRealDate(y, mo, d)) return { ok: false, error: "invalid" };
  const day = `${String(y).padStart(4, "0")}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return diffDays(today, day) < 0 ? { ok: false, error: "past" } : { ok: true, day };
}

export function formatExamDate(day: StudyDay): string {
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}

export function maskExamDate(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
