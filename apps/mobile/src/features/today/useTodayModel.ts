import { useEffect, useState } from "react";

import { getContainer } from "@/data/container";

import type { TodayModel } from "./model";

const DEFAULT_SESSION_MINUTES = 10;
const DEFAULT_RETENTION_TARGET = 90;

const EMPTY: TodayModel = {
  userName: "",
  memoryRetained: 0,
  memoryRatio: 0,
  streakDays: null,
  retentionPct: null,
  retentionTargetPct: DEFAULT_RETENTION_TARGET,
  week: [],
  dueCount: 0,
  sessionMinutes: DEFAULT_SESSION_MINUTES,
  caughtUpInDays: null,
  collections: [],
  exam: null,
};

export function useTodayModel(): TodayModel {
  const [model, setModel] = useState<TodayModel>(EMPTY);
  useEffect(() => {
    let off: (() => void) | null = null;
    let cancelled = false;
    void getContainer().then(({ cards, now }) => {
      if (cancelled) return;
      off = cards.watchToday(now()).subscribe((s) =>
        setModel({
          ...EMPTY,
          memoryRetained: s.retainedCount,
          memoryRatio: s.activeCount === 0 ? 0 : s.retainedCount / s.activeCount,
          dueCount: s.dueRows.length,
        }),
      );
    });
    return () => {
      cancelled = true;
      off?.();
    };
  }, []);
  return model;
}
