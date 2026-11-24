import { asc, eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

import {
  normalizeAvatarStyle,
  normalizeMinutes,
  normalizeNewCards,
  normalizeTheme,
  normalizeWeekdays,
  type Settings,
} from "@/domain/settings/settings";

import { ChangeBus } from "../db/change-bus";
import type { AppDb } from "../db/client";
import { outbox, settings } from "../db/schema";
import type { OutboxEntry, Subscribable } from "./cards";
import type { RepoDeps } from "./cards.memory";
import type { SettingsRepository } from "./settings";
import { SETTINGS_ID } from "./settings.memory";

const toSettings = (r: typeof settings.$inferSelect): Settings => ({
  dailyMinutes: normalizeMinutes(r.dailyMinutes),
  newCardsPerDay: normalizeNewCards(r.newCardsPerDay),
  theme: normalizeTheme(r.theme),
  avatarStyle: normalizeAvatarStyle(r.avatarStyle),
  avatarSeed: r.avatarSeed,
  offWeekdays: normalizeWeekdays(r.offWeekdays),
  goalText: r.goalText,
  updatedAt: r.updatedAt,
});

export class SqliteSettingsRepository implements SettingsRepository {
  readonly bus = new ChangeBus();

  constructor(
    private readonly db: AppDb,
    private readonly deps: RepoDeps,
  ) {}

  async get(): Promise<Settings | null> {
    const rows = await this.db.select().from(settings).where(eq(settings.id, SETTINGS_ID)).limit(1);
    return rows[0] ? toSettings(rows[0]) : null;
  }

  async save(value: Settings): Promise<void> {
    const set = {
      dailyMinutes: value.dailyMinutes,
      newCardsPerDay: value.newCardsPerDay,
      theme: value.theme,
      avatarStyle: value.avatarStyle,
      avatarSeed: value.avatarSeed,
      offWeekdays: [...value.offWeekdays],
      goalText: value.goalText,
      updatedAt: value.updatedAt,
    };
    const stmts: BatchItem<"sqlite">[] = [
      this.db
        .insert(settings)
        .values({ id: SETTINGS_ID, ...set })
        .onConflictDoUpdate({ target: settings.id, set }),
      this.db.insert(outbox).values({
        id: this.deps.newId(),
        entity: "settings",
        entityId: SETTINGS_ID,
        op: "upsert",
        payload: "{}",
        createdAt: this.deps.clock(),
      }),
    ];
    await this.db.batch(stmts as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
    this.bus.emit(["settings", "outbox"]);
  }

  watch(): Subscribable<Settings | null> {
    return {
      subscribe: (onValue, onError) => {
        let active = true;
        const refresh = () => {
          this.get().then(
            (v) => active && onValue(v),
            (e) => active && onError?.(e),
          );
        };
        const off = this.bus.on((t) => t.includes("settings") && refresh());
        refresh();
        return () => {
          active = false;
          off();
        };
      },
    };
  }

  async pendingOutbox(): Promise<readonly OutboxEntry[]> {
    const rows = await this.db
      .select()
      .from(outbox)
      .where(eq(outbox.entity, "settings"))
      .orderBy(asc(outbox.seq));
    return rows.map((r) => ({
      id: r.id,
      entity: "settings",
      entityId: r.entityId,
      op: r.op,
      createdAt: r.createdAt,
    }));
  }
}
