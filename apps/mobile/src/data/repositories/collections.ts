import type { Collection, Id } from "@/domain/types";

import type { OutboxEntry, Subscribable } from "./cards";

export interface CollectionsRepository {
  get(id: Id): Promise<Collection | null>;
  save(collection: Collection): Promise<void>;
  softDelete(id: Id): Promise<void>;
  listAll(): Promise<readonly Collection[]>;
  watchAll(): Subscribable<readonly Collection[]>;
  pendingOutbox(): Promise<readonly OutboxEntry[]>;
}
