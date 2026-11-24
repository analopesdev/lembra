import type { Collection, Id } from "@/domain/types";

import type { OutboxEntry, Subscribable } from "./cards";
import type { RepoDeps } from "./cards.memory";
import type { CollectionsRepository } from "./collections";

export class InMemoryCollectionsRepository implements CollectionsRepository {
  private items = new Map<Id, Collection>();
  private outbox: OutboxEntry[] = [];
  private outboxIds = new Set<string>();
  private listeners = new Set<() => void>();

  constructor(private readonly deps: RepoDeps) {}

  async get(id: Id): Promise<Collection | null> {
    const c = this.items.get(id);
    return c && !c.deletedAt ? c : null;
  }

  async save(collection: Collection): Promise<void> {
    this.commit(collection, "upsert");
  }

  async softDelete(id: Id): Promise<void> {
    const c = this.items.get(id);
    if (!c || c.deletedAt) return;
    const now = this.deps.clock();
    this.commit({ ...c, deletedAt: now, updatedAt: now }, "delete");
  }

  async listAll(): Promise<readonly Collection[]> {
    return this.list();
  }

  watchAll(): Subscribable<readonly Collection[]> {
    return {
      subscribe: (onValue) => {
        const run = () => onValue(this.list());
        this.listeners.add(run);
        queueMicrotask(run);
        return () => this.listeners.delete(run);
      },
    };
  }

  async pendingOutbox(): Promise<readonly OutboxEntry[]> {
    return [...this.outbox];
  }

  private list(): Collection[] {
    return [...this.items.values()]
      .filter((c) => !c.deletedAt)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || (a.id < b.id ? -1 : 1));
  }

  private commit(collection: Collection, op: "upsert" | "delete"): void {
    const id = this.deps.newId();
    if (this.outboxIds.has(id)) throw new Error(`outbox: id duplicado ${id}`);
    this.items.set(collection.id, collection);
    this.outbox.push({ id, entity: "collection", entityId: collection.id, op, createdAt: this.deps.clock() });
    this.outboxIds.add(id);
    for (const l of [...this.listeners]) l();
  }
}
