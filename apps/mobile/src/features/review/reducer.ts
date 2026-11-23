import type { Rating } from "@/domain/scheduling";
import type { CardWithState } from "@/domain/types";

export type Phase = "answering" | "result" | "summary";

export interface Outcome {
  readonly cardId: string;
  readonly rating: Rating;
  readonly suggested: Rating;
  readonly answeredAt: Date;
  readonly seconds: number;
}

export interface ReviewState {
  readonly queue: readonly CardWithState[];
  readonly index: number;
  readonly phase: Phase;
  readonly answer: string;
  readonly rating: Rating;
  readonly suggested: Rating;
  readonly seconds: number;
  readonly answeredAt: Date | null;
  readonly skipped: boolean;
  readonly expired: boolean;
  readonly outcomes: readonly Outcome[];
}

export type ReviewAction =
  | { type: "type"; text: string }
  | { type: "submit"; rating: Rating; seconds: number; at: Date }
  | { type: "giveUp"; seconds: number; at: Date }
  | { type: "adjust"; rating: Rating }
  | { type: "expire" }
  | { type: "next" }
  | { type: "finish" };

export function initialReviewState(queue: readonly CardWithState[]): ReviewState {
  return {
    queue,
    index: 0,
    phase: queue.length === 0 ? "summary" : "answering",
    answer: "",
    rating: 3,
    suggested: 3,
    seconds: 0,
    answeredAt: null,
    skipped: false,
    expired: false,
    outcomes: [],
  };
}

export function currentOutcome(s: ReviewState): Outcome | null {
  const card = s.queue[s.index];
  if (!card || s.phase !== "result" || !s.answeredAt) return null;
  return {
    cardId: card.card.id,
    rating: s.rating,
    suggested: s.suggested,
    answeredAt: s.answeredAt,
    seconds: s.seconds,
  };
}

export function reviewReducer(s: ReviewState, a: ReviewAction): ReviewState {
  switch (a.type) {
    case "type":
      return s.phase === "answering" ? { ...s, answer: a.text } : s;
    case "submit":
      if (s.phase !== "answering") return s;
      return {
        ...s,
        phase: "result",
        rating: a.rating,
        suggested: a.rating,
        seconds: a.seconds,
        answeredAt: a.at,
        skipped: false,
      };
    case "giveUp":
      if (s.phase !== "answering") return s;
      return {
        ...s,
        phase: "result",
        rating: 1,
        suggested: 1,
        seconds: a.seconds,
        answeredAt: a.at,
        skipped: true,
      };
    case "adjust":
      return s.phase === "result" ? { ...s, rating: a.rating } : s;
    case "expire":
      return s.expired ? s : { ...s, expired: true, phase: s.phase === "answering" ? "summary" : s.phase };
    case "next": {
      const outcome = currentOutcome(s);
      if (!outcome) return s;
      const outcomes = [...s.outcomes, outcome];
      const last = s.index + 1 >= s.queue.length;
      if (last || s.expired) return { ...s, outcomes, phase: "summary" };
      return {
        ...s,
        outcomes,
        index: s.index + 1,
        phase: "answering",
        answer: "",
        answeredAt: null,
        skipped: false,
      };
    }
    case "finish":
      return { ...s, phase: "summary" };
  }
}
