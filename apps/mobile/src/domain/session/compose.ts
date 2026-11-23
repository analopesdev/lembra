import { retrievability, type FsrsParams } from "../scheduling";
import { studyDayOf } from "../study-day/study-day";
import type { Importance } from "../types";
import { reviewValue } from "./review-value";
import { buildSession, isOverdue, sessionCapacity, sessionIds } from "./session";

export interface DueRow {
  readonly id: string;
  readonly importance: Importance;
  readonly due: Date;
  readonly stability: number;
  readonly lastReview: Date | null;
}

export interface ComposeInput {
  readonly rows: readonly DueRow[];
  readonly now: Date;
  readonly timeZone: string;
  readonly minutes: number;
  readonly params: FsrsParams;
  readonly newCardsLeftToday: number;
  readonly avgSecondsPerCard?: number;
}

export function composeSession(input: ComposeInput): string[] {
  const today = studyDayOf(input.now, input.timeZone);
  const dueToday: { id: string; value: number }[] = [];
  const overdue: { id: string; value: number }[] = [];
  const newCards: { id: string; importance: Importance; createdAt: Date }[] = [];
  for (const row of input.rows) {
    if (row.lastReview === null) {
      newCards.push({ id: row.id, importance: row.importance, createdAt: row.due });
      continue;
    }
    const r = retrievability(
      {
        due: row.due,
        lastReview: row.lastReview,
        stability: row.stability,
        difficulty: 0,
        state: 2,
        reps: 1,
        lapses: 0,
        scheduledDays: 0,
      },
      input.now,
      input.params.weights,
    );
    const item = { id: row.id, value: reviewValue(r, row.importance, null) };
    (isOverdue(row.due, today, input.timeZone) ? overdue : dueToday).push(item);
  }
  return sessionIds(
    buildSession({
      dueToday,
      overdue,
      newCards,
      capacity: sessionCapacity(input.minutes, input.avgSecondsPerCard),
      newCardsLeftToday: input.newCardsLeftToday,
    }),
  );
}
