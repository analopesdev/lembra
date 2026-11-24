import { useEffect, useState } from "react";

import { getContainer } from "@/data/container";
import type { TodaySummary } from "@/data/repositories/cards";
import type { Collection } from "@/domain/types";

import { buildTodayModel } from "./buildModel";
import type { TodayModel } from "./model";

const SESSION_MINUTES = 10;
const NEW_CARDS_PER_DAY = 5;
const RETENTION_TARGET_PCT = 90;

const EMPTY: TodayModel = {
  userName: "",
  memoryRetained: 0,
  memoryRatio: 0,
  streakDays: null,
  retentionPct: null,
  retentionTargetPct: RETENTION_TARGET_PCT,
  week: [],
  dueCount: 0,
  sessionMinutes: SESSION_MINUTES,
  caughtUpInDays: null,
  collections: [],
  exam: null,
};

export function useTodayModel(): TodayModel {
  const [model, setModel] = useState<TodayModel>(EMPTY);
  useEffect(() => {
    let cancelled = false;
    const offs: (() => void)[] = [];
    void getContainer().then(({ cards, collections, now }) => {
      if (cancelled) return;
      let summary: TodaySummary | null = null;
      let list: readonly Collection[] | null = null;
      const publish = () => {
        if (!summary || !list) return;
        setModel(
          buildTodayModel({
            summary,
            collections: list,
            now: now(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            sessionMinutes: SESSION_MINUTES,
            newCardsLeftToday: NEW_CARDS_PER_DAY,
            retentionTargetPct: RETENTION_TARGET_PCT,
          }),
        );
      };
      offs.push(
        cards.watchToday(now()).subscribe((s) => {
          summary = s;
          publish();
        }),
        collections.watchAll().subscribe((c) => {
          list = c;
          publish();
        }),
      );
    });
    return () => {
      cancelled = true;
      for (const off of offs) off();
    };
  }, []);
  return model;
}
