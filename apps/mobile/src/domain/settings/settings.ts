export const MINUTE_OPTIONS = [5, 10, 15, 20] as const;
export type DailyMinutes = (typeof MINUTE_OPTIONS)[number];

export interface Settings {
  readonly dailyMinutes: DailyMinutes;
  readonly offWeekdays: readonly number[];
  readonly goalText: string;
  readonly updatedAt: Date;
}

export const DEFAULT_DAILY_MINUTES: DailyMinutes = 10;

export function defaultSettings(now: Date): Settings {
  return { dailyMinutes: DEFAULT_DAILY_MINUTES, offWeekdays: [], goalText: "", updatedAt: now };
}

export function normalizeMinutes(value: number): DailyMinutes {
  return (MINUTE_OPTIONS as readonly number[]).includes(value)
    ? (value as DailyMinutes)
    : DEFAULT_DAILY_MINUTES;
}

export function normalizeWeekdays(days: readonly number[]): number[] {
  return [...new Set(days.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort((a, b) => a - b);
}
