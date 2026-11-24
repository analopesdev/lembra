import { useEffect, useState } from "react";

import { getContainer } from "@/data/container";
import type { TodaySummary } from "@/data/repositories/cards";
import { DEFAULT_DAILY_MINUTES } from "@/domain/settings/settings";
import type { Collection } from "@/domain/types";

import { buildTodayModel } from "./buildModel";
import type { TodayModel } from "./model";

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
  sessionMinutes: DEFAULT_DAILY_MINUTES,
  caughtUpInDays: null,
  collections: [],
  exam: null,
};

export function useTodayModel(): TodayModel {
  const [model, setModel] = useState<TodayModel>(EMPTY);
  useEffect(() => {
    let cancelled = false;
    const offs: (() => void)[] = [];
    void getContainer().then(({ cards, collections, settings, now }) => {
      if (cancelled) return;
      let summary: TodaySummary | null = null;
      let list: readonly Collection[] | null = null;
      let minutes: number | undefined;
      const publish = () => {
        if (!summary || !list || minutes === undefined) return;
        setModel(
          buildTodayModel({
            summary,
            collections: list,
            now: now(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            sessionMinutes: minutes,
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
        settings.watch().subscribe((v) => {
          minutes = v?.dailyMinutes ?? DEFAULT_DAILY_MINUTES;
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
