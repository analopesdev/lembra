export type WeekDayStatus = "done" | "frozen" | "today" | "pending";

export interface WeekDay {
  readonly key: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  readonly status: WeekDayStatus;
}

export type CollectionTone = "tint" | "collection2" | "collection3";
export type CollectionIcon = "bone" | "heart" | "flask";

export interface CollectionCard {
  readonly id: string;
  readonly name: string;
  readonly dueToday: number;
  readonly progress: number;
  readonly tone: CollectionTone;
  readonly icon: CollectionIcon;
}

export interface ExamBanner {
  readonly name: string;
  readonly daysLeft: number;
  readonly readinessPct: number;
}

export interface TodayModel {
  readonly userName: string;
  readonly memoryRetained: number;
  readonly memoryRatio: number;
  readonly streakDays: number | null;
  readonly retentionPct: number | null;
  readonly retentionTargetPct: number;
  readonly week: readonly WeekDay[];
  readonly dueCount: number;
  readonly sessionMinutes: number;
  readonly caughtUpInDays: number | null;
  readonly collections: readonly CollectionCard[];
  readonly exam: ExamBanner | null;
}
