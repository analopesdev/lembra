import type { Settings } from "@/domain/settings/settings";

import type { OutboxEntry, Subscribable } from "./cards";
import type { RepoDeps } from "./cards.memory";
import type { SettingsRepository } from "./settings";

export const SETTINGS_ID = "default";

export class InMemorySettingsRepository implements SettingsRepository {
  private value: Settings | null = null;
  private outbox: OutboxEntry[] = [];
  private outboxIds = new Set<string>();
  private listeners = new Set<() => void>();

  constructor(private readonly deps: RepoDeps) {}

  async get(): Promise<Settings | null> {
    return this.value;
  }

  async save(settings: Settings): Promise<void> {
    const id = this.deps.newId();
    if (this.outboxIds.has(id)) throw new Error(`outbox: id duplicado ${id}`);
    this.value = settings;
    this.outbox.push({
      id,
      entity: "settings",
      entityId: SETTINGS_ID,
      op: "upsert",
      createdAt: this.deps.clock(),
    });
    this.outboxIds.add(id);
    for (const l of [...this.listeners]) l();
  }

  watch(): Subscribable<Settings | null> {
    return {
      subscribe: (onValue) => {
        const run = () => onValue(this.value);
        this.listeners.add(run);
        queueMicrotask(run);
        return () => this.listeners.delete(run);
      },
    };
  }

  async pendingOutbox(): Promise<readonly OutboxEntry[]> {
    return [...this.outbox];
  }
}
