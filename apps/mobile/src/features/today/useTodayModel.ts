import { useEffect, useState } from "react";

import { getContainer } from "@/data/container";
import type { TodaySummary } from "@/data/repositories/cards";
import {
  DEFAULT_AVATAR_STYLE,
  DEFAULT_DAILY_MINUTES,
  DEFAULT_NEW_CARDS_PER_DAY,
} from "@/domain/settings/settings";
import type { Collection } from "@/domain/types";

import { buildTodayModel } from "./buildModel";
import type { TodayModel } from "./model";

const RETENTION_TARGET_PCT = 90;

const EMPTY: TodayModel = {
  userName: "",
  avatarStyle: "thumbs",
  avatarSeed: "",
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
      let newCards = DEFAULT_NEW_CARDS_PER_DAY;
      let avatarStyle: string = DEFAULT_AVATAR_STYLE;
      let avatarSeed = "";
      const publish = () => {
        if (!summary || !list || minutes === undefined) return;
        setModel(
          buildTodayModel({
            summary,
            collections: list,
            now: now(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            sessionMinutes: minutes,
            newCardsLeftToday: newCards,
            avatarStyle,
            avatarSeed,
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
          newCards = v?.newCardsPerDay ?? DEFAULT_NEW_CARDS_PER_DAY;
          avatarStyle = v?.avatarStyle ?? DEFAULT_AVATAR_STYLE;
          avatarSeed = v?.avatarSeed ?? "";
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
