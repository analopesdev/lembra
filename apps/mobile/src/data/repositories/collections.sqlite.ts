import { and, asc, eq, isNull } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

import type { Collection, Id } from "@/domain/types";

import { ChangeBus } from "../db/change-bus";
import type { AppDb } from "../db/client";
import { collections, outbox } from "../db/schema";
import type { OutboxEntry, Subscribable } from "./cards";
import type { RepoDeps } from "./cards.memory";
import type { CollectionsRepository } from "./collections";

const toCollection = (r: typeof collections.$inferSelect): Collection => ({
  id: r.id,
  name: r.name,
  icon: r.icon,
  tone: r.tone,
  examDay: r.examDay,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  deletedAt: r.deletedAt,
});

export class SqliteCollectionsRepository implements CollectionsRepository {
  readonly bus = new ChangeBus();
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly db: AppDb,
    private readonly deps: RepoDeps,
  ) {}

  async get(id: Id): Promise<Collection | null> {
    const rows = await this.db
      .select()
      .from(collections)
      .where(and(eq(collections.id, id), isNull(collections.deletedAt)))
      .limit(1);
    return rows[0] ? toCollection(rows[0]) : null;
  }

  save(collection: Collection): Promise<void> {
    return this.write(collection, "upsert");
  }

  async softDelete(id: Id): Promise<void> {
    const rows = await this.db.select().from(collections).where(eq(collections.id, id)).limit(1);
    const row = rows[0];
    if (!row || row.deletedAt) return;
    const now = this.deps.clock();
    await this.write({ ...toCollection(row), deletedAt: now, updatedAt: now }, "delete");
  }

  watchAll(): Subscribable<readonly Collection[]> {
    return {
      subscribe: (onValue, onError) => {
        let active = true;
        let running = false;
        let dirty = false;
        const refresh = async () => {
          if (running) {
            dirty = true;
            return;
          }
          running = true;
          try {
            do {
              dirty = false;
              const rows = await this.db
                .select()
                .from(collections)
                .where(isNull(collections.deletedAt))
                .orderBy(asc(collections.createdAt), asc(collections.id));
              if (active) onValue(rows.map(toCollection));
            } while (dirty && active);
          } catch (e) {
            if (active) onError?.(e);
          } finally {
            running = false;
          }
        };
        const off = this.bus.on((tables) => {
          if (tables.includes("collections")) void refresh();
        });
        void refresh();
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
      .where(eq(outbox.entity, "collection"))
      .orderBy(asc(outbox.seq));
    return rows.map((r) => ({
      id: r.id,
      entity: "collection",
      entityId: r.entityId,
      op: r.op,
      createdAt: r.createdAt,
    }));
  }

  private write(collection: Collection, op: "upsert" | "delete"): Promise<void> {
    const run = async () => {
      const set = {
        name: collection.name,
        icon: collection.icon,
        tone: collection.tone,
        examDay: collection.examDay,
        updatedAt: collection.updatedAt,
        deletedAt: collection.deletedAt,
      };
      const values = { id: collection.id, createdAt: collection.createdAt, ...set };
      const stmts: BatchItem<"sqlite">[] = [
        this.db.insert(collections).values(values).onConflictDoUpdate({ target: collections.id, set }),
        this.db.insert(outbox).values({
          id: this.deps.newId(),
          entity: "collection",
          entityId: collection.id,
          op,
          payload: "{}",
          createdAt: this.deps.clock(),
        }),
      ];
      await this.db.batch(stmts as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
      this.bus.emit(["collections", "outbox"]);
    };
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
  }
}
