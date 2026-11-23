// RN-05: retenção alvo da coleção conforme a prova se aproxima. Pura.
import { diffDays, type StudyDay } from "../study-day/study-day";

export const DEFAULT_RETENTION = 0.9;

/** Dias até a prova (negativo = já passou); `null` sem prova. */
export function daysUntilExam(today: StudyDay, examDay: StudyDay | null): number | null {
  return examDay === null ? null : diffDays(today, examDay);
}

/** > 30 dias: 85% · 8–30: 90% · ≤ 7 (até o dia da prova): 95% · depois da prova ou sem prova: 90%. */
export function examRetention(daysToExam: number | null): number {
  if (daysToExam === null || daysToExam < 0) return DEFAULT_RETENTION;
  if (daysToExam > 30) return 0.85;
  if (daysToExam >= 8) return 0.9;
  return 0.95;
}

/** Com prova em ≤ 7 dias, os cards de importância 3 entram primeiro (RN-05). */
export function prioritizeImportance3(daysToExam: number | null): boolean {
  return daysToExam !== null && daysToExam >= 0 && daysToExam <= 7;
}
