import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import type { CardsRepository } from "@/data/repositories/cards";
import { intervalDaysFor, provisionalGrader } from "@/domain/review";
import { defaultParams, type Rating } from "@/domain/scheduling";
import type { CardWithState } from "@/domain/types";

import { currentOutcome, initialReviewState, reviewReducer } from "./reducer";
import { ReviewView, type ReviewViewModel } from "./ReviewView";

export type ReviewDeps = {
  cards: Pick<CardsRepository, "recordReview">;
  now: () => Date;
  newId: () => string;
};

type Props = {
  queue: readonly CardWithState[];
  minutes: number;
  deps: ReviewDeps;
  onClose: () => void;
};

const PARAMS = defaultParams();

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function ReviewRunner({ queue, minutes, deps, onClose }: Props) {
  const [s, dispatch] = useReducer(reviewReducer, queue, initialReviewState);
  const totalSeconds = minutes * 60;
  const startedAt = useRef(deps.now());
  const shownAt = useRef(deps.now());
  const [left, setLeft] = useState(totalSeconds);

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = totalSeconds - (deps.now().getTime() - startedAt.current.getTime()) / 1000;
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) dispatch({ type: "expire" });
    }, 1000);
    return () => clearInterval(id);
  }, [deps, totalSeconds]);

  const card = s.queue[s.index];
  const elapsed = useCallback(() => (deps.now().getTime() - shownAt.current.getTime()) / 1000, [deps]);

  const submit = useCallback(() => {
    if (!card) return;
    const seconds = elapsed();
    const { rating } = provisionalGrader.grade(s.answer, card.card.back, seconds);
    dispatch({ type: "submit", rating, seconds, at: deps.now() });
  }, [card, s.answer, deps, elapsed]);

  const giveUp = useCallback(() => {
    dispatch({ type: "giveUp", seconds: elapsed(), at: deps.now() });
  }, [deps, elapsed]);

  const next = useCallback(async () => {
    const outcome = currentOutcome(s);
    if (!outcome) return;
    await deps.cards.recordReview({
      id: deps.newId(),
      cardId: outcome.cardId,
      at: outcome.answeredAt,
      rating: outcome.rating,
    });
    shownAt.current = deps.now();
    dispatch({ type: "next" });
  }, [s, deps]);

  const reviewed = s.outcomes.length;
  const hits = s.outcomes.filter((o) => o.rating >= 3).length;
  const spent = Math.min(totalSeconds, totalSeconds - left);

  const model: ReviewViewModel = {
    phase: s.phase,
    front: card?.card.front ?? "",
    back: card?.card.back ?? "",
    position: s.index + 1,
    total: s.queue.length,
    timeLeftRatio: left / totalSeconds,
    timeLeftLabel: formatClock(left),
    answer: s.answer,
    rating: s.rating,
    seconds: s.seconds,
    skipped: s.skipped,
    intervalDays:
      card && s.answeredAt ? intervalDaysFor(card.state, s.rating as Rating, s.answeredAt, PARAMS) : 1,
    isLast: s.index + 1 >= s.queue.length || s.expired,
    reviewed,
    hits,
    elapsedLabel: formatClock(spent),
  };

  return (
    <ReviewView
      model={model}
      onChangeAnswer={(text) => dispatch({ type: "type", text })}
      onSubmit={submit}
      onGiveUp={giveUp}
      onAdjust={(rating) => dispatch({ type: "adjust", rating })}
      onNext={() => void next()}
      onClose={s.phase === "summary" ? onClose : () => dispatch({ type: "finish" })}
    />
  );
}
