import { diffDays, studyDayOf } from "../study-day/study-day";

import { applyReview, type CardState, type FsrsParams, type Rating } from "./derive-state";

export type IntervalPreview = Record<Rating, number>;

const RATINGS: readonly Rating[] = [1, 2, 3, 4];

export function previewIntervals(
  state: CardState,
  now: Date,
  params: FsrsParams,
  timeZone: string,
): IntervalPreview {
  const today = studyDayOf(now, timeZone);
  const out = {} as Record<Rating, number>;
  for (const rating of RATINGS) {
    const next = applyReview(state, { id: "preview", at: now, rating, kind: "review" }, params);
    out[rating] = Math.max(0, diffDays(today, studyDayOf(next.due, timeZone)));
  }
  return out;
}
