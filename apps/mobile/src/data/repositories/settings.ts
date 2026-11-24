import type { Settings } from "@/domain/settings/settings";

import type { OutboxEntry, Subscribable } from "./cards";

export interface SettingsRepository {
  get(): Promise<Settings | null>;
  save(settings: Settings): Promise<void>;
  watch(): Subscribable<Settings | null>;
  pendingOutbox(): Promise<readonly OutboxEntry[]>;
}
