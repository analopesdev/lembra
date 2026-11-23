import { initialState } from "@/domain/scheduling";
import type { Card, CardWithState, Id } from "@/domain/types";

import type { CardsRepository, OutboxEntry, Subscribable, TodaySummary } from "./cards";

import type { CardState } from "@/domain/scheduling";

export interface RepoDeps {
  readonly clock: () => Date;
  readonly newId: () => string;
}

/** Implementação em memória: base dos testes de features e referência do contrato. */
export class InMemoryCardsRepository implements CardsRepository {
  private cards = new Map<Id, Card>();
  private states = new Map<Id, CardState>();
  private outbox: OutboxEntry[] = [];
  private outboxIds = new Set<string>();
  private listeners = new Set<() => void>();

  constructor(private readonly deps: RepoDeps) {}

  async get(id: Id): Promise<Card | null> {
    const c = this.cards.get(id);
    return c && !c.deletedAt ? c : null;
  }

  async save(card: Card): Promise<void> {
    await this.commit([card], []);
  }

  async saveMany(cards: readonly Card[]): Promise<void> {
    await this.commit(cards, []);
  }

  async softDelete(id: Id): Promise<void> {
    const c = this.cards.get(id);
    if (!c || c.deletedAt) return;
    const now = this.deps.clock();
    await this.commit([{ ...c, deletedAt: now, updatedAt: now }], [id]);
  }

  async approveDrafts(ids: readonly Id[]): Promise<void> {
    const now = this.deps.clock();
    const drafts = ids
      .map((id) => this.cards.get(id))
      .filter((c): c is Card => !!c && !c.deletedAt && c.status === "draft")
      .map((c) => ({ ...c, status: "active" as const, updatedAt: now }));
    await this.commit(drafts, []);
  }

  watchDue(now: Date): Subscribable<readonly CardWithState[]> {
    return this.watch(() =>
      this.active()
        .filter((x) => x.state.due.getTime() <= now.getTime())
        .sort((a, b) => a.state.due.getTime() - b.state.due.getTime() || (a.card.id < b.card.id ? -1 : 1)),
    );
  }

  watchActive(): Subscribable<readonly CardWithState[]> {
    return this.watch(() => this.active());
  }

  watchToday(now: Date): Subscribable<TodaySummary> {
    return this.watch(() => {
      const act = this.active();
      const day = 86_400_000;
      return {
        activeCount: act.length,
        retainedCount: act.filter(
          ({ state }) =>
            state.lastReview !== null && now.getTime() <= state.lastReview.getTime() + state.stability * day,
        ).length,
        dueRows: act
          .filter(({ state }) => state.due.getTime() <= now.getTime())
          .map(({ card, state }) => ({
            id: card.id,
            importance: card.importance,
            due: state.due,
            stability: state.stability,
            lastReview: state.lastReview,
          })),
      };
    });
  }

  async pendingOutbox(): Promise<readonly OutboxEntry[]> {
    return [...this.outbox];
  }

  private active(): CardWithState[] {
    const out: CardWithState[] = [];
    for (const card of this.cards.values()) {
      const state = this.states.get(card.id);
      if (card.status === "active" && !card.deletedAt && state) out.push({ card, state });
    }
    return out;
  }

  /** Atômico: valida tudo antes de alterar qualquer coisa. */
  private async commit(cards: readonly Card[], deletedIds: readonly Id[]): Promise<void> {
    const now = this.deps.clock();
    const entries: OutboxEntry[] = cards.map((c) => ({
      id: this.deps.newId(),
      entity: "card",
      entityId: c.id,
      op: deletedIds.includes(c.id) ? "delete" : "upsert",
      createdAt: now,
    }));
    const seen = new Set<string>();
    for (const e of entries) {
      if (this.outboxIds.has(e.id) || seen.has(e.id)) throw new Error(`outbox: id duplicado ${e.id}`);
      seen.add(e.id);
    }
    for (const c of cards) {
      this.cards.set(c.id, c);
      if (c.status === "active" && !this.states.has(c.id)) this.states.set(c.id, initialState(now));
    }
    for (const e of entries) {
      this.outbox.push(e);
      this.outboxIds.add(e.id);
    }
    for (const l of [...this.listeners]) l();
  }

  private watch<T>(query: () => T): Subscribable<T> {
    return {
      subscribe: (onValue) => {
        const run = () => onValue(query());
        this.listeners.add(run);
        queueMicrotask(run);
        return () => this.listeners.delete(run);
      },
    };
  }
}
