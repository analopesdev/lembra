export type WeekDayStatus = "done" | "frozen" | "today" | "pending";

export interface WeekDay {
  readonly key: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  readonly status: WeekDayStatus;
}

import type { CollectionIconName, CollectionTone } from "@/domain/types";

export interface CollectionCard {
  readonly id: string;
  readonly name: string;
  readonly dueToday: number;
  readonly progress: number;
  readonly tone: CollectionTone;
  readonly icon: CollectionIconName;
}

export interface ExamBanner {
  readonly name: string;
  readonly daysLeft: number;
  readonly readinessPct: number | null;
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
