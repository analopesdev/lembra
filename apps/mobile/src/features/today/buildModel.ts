import type { TodaySummary } from "@/data/repositories/cards";
import { defaultParams, type FsrsParams } from "@/domain/scheduling";
import { composeSession } from "@/domain/session/compose";
import { daysToClearDebt, isOverdue, sessionCapacity } from "@/domain/session/session";
import { diffDays, studyDayOf } from "@/domain/study-day/study-day";
import type { Collection } from "@/domain/types";

import type { CollectionCard, ExamBanner, TodayModel } from "./model";

export interface BuildTodayInput {
  readonly summary: TodaySummary;
  readonly collections: readonly Collection[];
  readonly now: Date;
  readonly timeZone: string;
  readonly sessionMinutes: number;
  readonly newCardsLeftToday: number;
  readonly avatarSeed?: string;
  readonly retentionTargetPct: number;
  readonly params?: FsrsParams;
}

export function buildTodayModel(input: BuildTodayInput): TodayModel {
  const { summary, now, timeZone } = input;
  const today = studyDayOf(now, timeZone);
  const capacity = sessionCapacity(input.sessionMinutes);
  const session = composeSession({
    rows: summary.dueRows,
    now,
    timeZone,
    minutes: input.sessionMinutes,
    params: input.params ?? defaultParams(),
    newCardsLeftToday: input.newCardsLeftToday,
  });
  const debt = summary.dueRows.filter(
    (r) => r.lastReview !== null && isOverdue(r.due, today, timeZone),
  ).length;

  const dueByCollection = new Map<string, number>();
  for (const r of summary.dueRows) {
    if (r.collectionId !== null)
      dueByCollection.set(r.collectionId, (dueByCollection.get(r.collectionId) ?? 0) + 1);
  }
  const statsByCollection = new Map(summary.byCollection.map((s) => [s.collectionId, s]));
  const cards: CollectionCard[] = input.collections.map((c) => {
    const stats = statsByCollection.get(c.id);
    return {
      id: c.id,
      name: c.name,
      dueToday: dueByCollection.get(c.id) ?? 0,
      progress: stats && stats.active > 0 ? stats.retained / stats.active : 0,
      cardCount: stats?.active ?? 0,
      examDaysLeft: c.examDay === null ? null : Math.max(-1, diffDays(today, c.examDay)),
      tone: c.tone,
      icon: c.icon,
    };
  });

  const upcoming = input.collections
    .flatMap((c) => (c.examDay === null ? [] : [{ c, days: diffDays(today, c.examDay) }]))
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days || (a.c.id < b.c.id ? -1 : 1))[0];
  const exam: ExamBanner | null = upcoming
    ? { name: upcoming.c.name, daysLeft: upcoming.days, readinessPct: null }
    : null;

  return {
    userName: "",
    avatarSeed: input.avatarSeed ?? "",
    memoryRetained: summary.retainedCount,
    memoryRatio: summary.activeCount === 0 ? 0 : summary.retainedCount / summary.activeCount,
    streakDays: null,
    retentionPct: null,
    retentionTargetPct: input.retentionTargetPct,
    week: [],
    dueCount: session.length,
    sessionMinutes: input.sessionMinutes,
    caughtUpInDays: debt > 0 ? daysToClearDebt(debt, capacity) : null,
    collections: cards,
    exam,
  };
}
