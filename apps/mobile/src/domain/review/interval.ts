import { applyReview, type CardState, type FsrsParams, type Rating } from "../scheduling";

export function intervalDaysFor(state: CardState, rating: Rating, at: Date, params: FsrsParams): number {
  const next = applyReview(state, { id: "preview", at, rating }, params);
  return Math.max(1, Math.round(next.scheduledDays));
}
