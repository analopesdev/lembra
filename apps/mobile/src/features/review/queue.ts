import { defaultParams, retrievability } from "@/domain/scheduling";
import { reviewValue } from "@/domain/session/review-value";
import { buildSession, isOverdue, sessionCapacity, sessionIds } from "@/domain/session/session";
import { studyDayOf } from "@/domain/study-day/study-day";
import type { CardWithState } from "@/domain/types";

export const NEW_CARDS_PER_DAY = 20;

export function buildQueue(
  due: readonly CardWithState[],
  now: Date,
  minutes: number,
  timeZone: string,
): CardWithState[] {
  const weights = defaultParams().weights;
  const today = studyDayOf(now, timeZone);
  const byId = new Map(due.map((c) => [c.card.id, c]));
  const valued = (c: CardWithState) => ({
    id: c.card.id,
    value: reviewValue(retrievability(c.state, now, weights), c.card.importance, null),
  });
  const reviews = due.filter((c) => c.state.state !== 0);
  const session = buildSession({
    dueToday: reviews.filter((c) => !isOverdue(c.state.due, today, timeZone)).map(valued),
    overdue: reviews.filter((c) => isOverdue(c.state.due, today, timeZone)).map(valued),
    newCards: due
      .filter((c) => c.state.state === 0)
      .map((c) => ({ id: c.card.id, importance: c.card.importance, createdAt: c.card.createdAt })),
    capacity: sessionCapacity(minutes),
    newCardsLeftToday: NEW_CARDS_PER_DAY,
  });
  return sessionIds(session).flatMap((id) => {
    const found = byId.get(id);
    return found ? [found] : [];
  });
}
