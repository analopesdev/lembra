import type { Rating } from "../scheduling";

export type Phase = "front" | "back";

export interface QueueItem {
  readonly id: string;
  readonly retry: boolean;
}

export interface GradeEvent {
  readonly cardId: string;
  readonly rating: Rating;
  readonly kind: "review" | "in_session_retry";
  readonly at: number;
  readonly answerMs: number;
}

export interface SessionState {
  readonly status: "active" | "finished";
  readonly queue: readonly QueueItem[];
  readonly phase: Phase;
  readonly startedAt: number;
  readonly endsAt: number;
  readonly shownAt: number;
  readonly events: readonly GradeEvent[];
}

export interface Summary {
  readonly reviewed: number;
  readonly hits: number;
  readonly retries: number;
}

export function startSession(ids: readonly string[], now: number, minutes: number): SessionState {
  return {
    status: ids.length === 0 ? "finished" : "active",
    queue: ids.map((id) => ({ id, retry: false })),
    phase: "front",
    startedAt: now,
    endsAt: now + minutes * 60_000,
    shownAt: now,
    events: [],
  };
}

export function currentCard(state: SessionState): QueueItem | null {
  return state.status === "active" ? (state.queue[0] ?? null) : null;
}

export function reveal(state: SessionState): SessionState {
  return state.status === "active" && state.phase === "front" ? { ...state, phase: "back" } : state;
}

export function grade(
  state: SessionState,
  rating: Rating,
  now: number,
): { state: SessionState; event: GradeEvent | null } {
  const item = currentCard(state);
  if (!item || state.phase !== "back") return { state, event: null };
  const event: GradeEvent = {
    cardId: item.id,
    rating,
    kind: item.retry ? "in_session_retry" : "review",
    at: now,
    answerMs: Math.max(0, now - state.shownAt),
  };
  const rest = state.queue.slice(1);
  const queue = rating === 1 ? [...rest, { id: item.id, retry: true }] : rest;
  const timeUp = now >= state.endsAt;
  const finished = queue.length === 0 || timeUp;
  return {
    state: {
      ...state,
      status: finished ? "finished" : "active",
      queue: finished ? [] : queue,
      phase: "front",
      shownAt: now,
      events: [...state.events, event],
    },
    event,
  };
}

export function endSession(state: SessionState): SessionState {
  return state.status === "finished" ? state : { ...state, status: "finished", queue: [] };
}

export function elapsedRatio(state: SessionState, now: number): number {
  const total = state.endsAt - state.startedAt;
  return total <= 0 ? 1 : Math.min(1, Math.max(0, (now - state.startedAt) / total));
}

export function remainingMs(state: SessionState, now: number): number {
  return Math.max(0, state.endsAt - now);
}

export function summarize(state: SessionState): Summary {
  const first = state.events.filter((e) => e.kind === "review");
  return {
    reviewed: first.length,
    hits: first.filter((e) => e.rating !== 1).length,
    retries: state.events.length - first.length,
  };
}
