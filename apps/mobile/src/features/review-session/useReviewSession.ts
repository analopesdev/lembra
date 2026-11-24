import { useCallback, useEffect, useState } from "react";

import { getContainer, type Container } from "@/data/container";
import type { TodaySummary } from "@/data/repositories/cards";
import { defaultParams, type Rating } from "@/domain/scheduling";
import { composeSession } from "@/domain/session/compose";
import {
  currentCard,
  elapsedRatio,
  endSession,
  grade as gradeCard,
  remainingMs,
  reveal as revealCard,
  startSession,
  summarize,
  type SessionState,
} from "@/domain/session/review-flow";
import { DEFAULT_DAILY_MINUTES, DEFAULT_NEW_CARDS_PER_DAY } from "@/domain/settings/settings";
import type { Card } from "@/domain/types";
import { cryptoRandomBytes, uuidv7 } from "@/shared/lib/uuidv7";

import type { SessionSummaryView } from "./SummaryView";

const CLOCK_MS = 1000;

export type ReviewStatus = "loading" | "empty" | "active" | "finished";

export interface ReviewSession {
  status: ReviewStatus;
  card: Card | null;
  collectionName: string;
  isRetry: boolean;
  position: { current: number; total: number };
  phase: "front" | "back";
  elapsedRatio: number;
  remainingMs: number;
  summary: SessionSummaryView | null;
  reveal: () => void;
  grade: (rating: Rating) => void;
  close: () => void;
}

function readToday(container: Container): Promise<TodaySummary> {
  return new Promise((resolve) => {
    const off = container.cards.watchToday(container.now()).subscribe((summary) => {
      queueMicrotask(off);
      resolve(summary);
    });
  });
}

export function useReviewSession(): ReviewSession {
  const [container, setContainer] = useState<Container | null>(null);
  const [state, setState] = useState<SessionState | null>(null);
  const [status, setStatus] = useState<ReviewStatus>("loading");
  const [card, setCard] = useState<Card | null>(null);
  const [collectionName, setCollectionName] = useState("");
  const [total, setTotal] = useState(0);
  const [now, setNow] = useState(0);
  const [memory, setMemory] = useState({ before: 0, after: 0 });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const c = await getContainer();
      const saved = await c.settings.get();
      const minutes = saved?.dailyMinutes ?? DEFAULT_DAILY_MINUTES;
      const summary = await readToday(c);
      if (cancelled) return;
      const ids = composeSession({
        rows: summary.dueRows,
        now: c.now(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        minutes,
        params: defaultParams(),
        newCardsLeftToday: saved?.newCardsPerDay ?? DEFAULT_NEW_CARDS_PER_DAY,
      });
      setContainer(c);
      setTotal(ids.length);
      setMemory({ before: summary.retainedCount, after: summary.retainedCount });
      setNow(c.now().getTime());
      if (ids.length === 0) {
        setStatus("empty");
        return;
      }
      setState(startSession(ids, c.now().getTime(), minutes));
      setStatus("active");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const item = state ? currentCard(state) : null;
  const currentId = item?.id ?? null;

  useEffect(() => {
    if (!container || !currentId) return;
    let cancelled = false;
    void container.cards.get(currentId).then(async (c) => {
      const collection = c ? await container.collections.get(c.collectionId) : null;
      if (cancelled) return;
      setCard(c);
      setCollectionName(collection?.name ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [container, currentId]);

  useEffect(() => {
    if (status !== "active" || !container) return;
    const id = setInterval(() => setNow(container.now().getTime()), CLOCK_MS);
    return () => clearInterval(id);
  }, [status, container]);

  const finish = useCallback(
    async (final: SessionState) => {
      if (container) {
        const after = (await readToday(container)).retainedCount;
        setMemory((m) => ({ ...m, after }));
      }
      setState(final);
      setStatus("finished");
    },
    [container],
  );

  const reveal = useCallback(() => setState((s) => (s ? revealCard(s) : s)), []);

  const grade = useCallback(
    (rating: Rating) => {
      if (!state || !container) return;
      const at = container.now().getTime();
      const out = gradeCard(state, rating, at);
      if (!out.event) return;
      const event = out.event;
      void container.cards
        .recordReview({
          id: uuidv7(at, cryptoRandomBytes),
          cardId: event.cardId,
          at: new Date(event.at),
          rating: event.rating,
          kind: event.kind,
        })
        .then(() => (out.state.status === "finished" ? finish(out.state) : setState(out.state)));
    },
    [state, container, finish],
  );

  const close = useCallback(() => {
    if (state) void finish(endSession(state));
  }, [state, finish]);

  const done = state ? summarize(state) : null;
  return {
    status,
    card: item ? card : null,
    collectionName,
    isRetry: item?.retry ?? false,
    position: { current: done ? Math.min(total, done.reviewed + 1) : 0, total },
    phase: state?.phase ?? "front",
    elapsedRatio: state ? elapsedRatio(state, now) : 0,
    remainingMs: state ? remainingMs(state, now) : 0,
    summary:
      done && status === "finished"
        ? { ...done, memoryBefore: memory.before, memoryAfter: memory.after }
        : null,
    reveal,
    grade,
    close,
  };
}
