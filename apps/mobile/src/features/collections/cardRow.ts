export type CardRowKind = "due" | "learning" | "mastered";

export const MASTERED_DAYS = 21;

export function cardRowKind(daysUntilDue: number): CardRowKind {
  if (daysUntilDue <= 0) return "due";
  return daysUntilDue >= MASTERED_DAYS ? "mastered" : "learning";
}

export function dueLabel(daysUntilDue: number, today: string): string {
  return daysUntilDue <= 0 ? today : `${daysUntilDue}d`;
}
