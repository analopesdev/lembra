export const MINUTE_OPTIONS = [5, 10, 15, 20] as const;
export type DailyMinutes = (typeof MINUTE_OPTIONS)[number];

export type ThemePreference = "auto" | "light" | "dark";
export const MIN_NEW_CARDS = 1;
export const MAX_NEW_CARDS = 50;
export const DEFAULT_NEW_CARDS_PER_DAY = 5;

export interface Settings {
  readonly dailyMinutes: DailyMinutes;
  readonly newCardsPerDay: number;
  readonly theme: ThemePreference;
  readonly offWeekdays: readonly number[];
  readonly goalText: string;
  readonly updatedAt: Date;
}

export const DEFAULT_DAILY_MINUTES: DailyMinutes = 10;

export function defaultSettings(now: Date): Settings {
  return {
    dailyMinutes: DEFAULT_DAILY_MINUTES,
    newCardsPerDay: DEFAULT_NEW_CARDS_PER_DAY,
    theme: "auto",
    offWeekdays: [],
    goalText: "",
    updatedAt: now,
  };
}

export function normalizeMinutes(value: number): DailyMinutes {
  return (MINUTE_OPTIONS as readonly number[]).includes(value)
    ? (value as DailyMinutes)
    : DEFAULT_DAILY_MINUTES;
}

export function normalizeWeekdays(days: readonly number[]): number[] {
  return [...new Set(days.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort((a, b) => a - b);
}

export function normalizeNewCards(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_NEW_CARDS_PER_DAY;
  return Math.min(MAX_NEW_CARDS, Math.max(MIN_NEW_CARDS, Math.round(value)));
}

export function normalizeTheme(value: string): ThemePreference {
  return value === "light" || value === "dark" ? value : "auto";
}
