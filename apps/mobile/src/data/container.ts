import { defaultParams } from "@/domain/scheduling";
import { cryptoRandomBytes, uuidv7 } from "@/shared/lib/uuidv7";

import { openDb } from "./db/client";
import type { CardsRepository } from "./repositories/cards";
import { SqliteCardsRepository } from "./repositories/cards.sqlite";

export interface Container {
  readonly cards: CardsRepository;
  readonly now: () => Date;
  readonly newId: () => string;
}

let pending: Promise<Container> | null = null;

export function getContainer(): Promise<Container> {
  pending ??= (async () => {
    const { db } = await openDb("lembra.db");
    const now = () => new Date();
    const newId = () => uuidv7(now().getTime(), cryptoRandomBytes);
    const cards = new SqliteCardsRepository(db, { clock: now, newId, fsrs: defaultParams() });
    return { cards, now, newId };
  })();
  return pending;
}
