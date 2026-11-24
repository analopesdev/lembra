import { defaultParams } from "@/domain/scheduling";
import { cryptoRandomBytes, uuidv7 } from "@/shared/lib/uuidv7";

import { openDb } from "./db/client";
import type { CardsRepository } from "./repositories/cards";
import { SqliteCardsRepository } from "./repositories/cards.sqlite";
import type { CollectionsRepository } from "./repositories/collections";
import type { SettingsRepository } from "./repositories/settings";
import { SqliteSettingsRepository } from "./repositories/settings.sqlite";
import { SqliteCollectionsRepository } from "./repositories/collections.sqlite";

export interface Container {
  readonly cards: CardsRepository;
  readonly collections: CollectionsRepository;
  readonly settings: SettingsRepository;
  readonly now: () => Date;
  readonly newId: () => string;
}

let pending: Promise<Container> | null = null;

export function getContainer(): Promise<Container> {
  pending ??= (async () => {
    const { db } = await openDb("lembra.db");
    const now = () => new Date();
    const newId = () => uuidv7(now().getTime(), cryptoRandomBytes);
    const deps = { clock: now, newId, fsrs: defaultParams() };
    return {
      cards: new SqliteCardsRepository(db, deps),
      collections: new SqliteCollectionsRepository(db, deps),
      settings: new SqliteSettingsRepository(db, deps),
      now,
      newId,
    };
  })();
  return pending;
}
