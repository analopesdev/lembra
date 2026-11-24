import { and, asc, count, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

import {
  applyReview,
  cacheRow,
  initialState,
  rebuildCache,
  sortHistory,
  type CardState,
  type ReviewEvent,
} from "@/domain/scheduling";
import type { Card, CardWithState, Id } from "@/domain/types";

import { ChangeBus } from "../db/change-bus";
import type { AppDb } from "../db/client";
import { cardStates, cards, outbox, reviewLogs } from "../db/schema";
import type { CardsRepository, OutboxEntry, ReviewInput, Subscribable, TodaySummary } from "./cards";
import type { RepoDeps } from "./cards.memory";

type CardRow = typeof cards.$inferSelect;
type StateRow = typeof cardStates.$inferSelect;

const toCard = (r: CardRow): Card => ({
  id: r.id,
  collectionId: r.collectionId,
  front: r.front,
  back: r.back,
  tags: r.tags,
  importance: r.importance,
  status: r.status,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  deletedAt: r.deletedAt,
});

const toState = (r: StateRow): CardState => ({
  due: r.due,
  lastReview: r.lastReview,
  stability: r.stability,
  difficulty: r.difficulty,
  state: r.state,
  reps: r.reps,
  lapses: r.lapses,
  scheduledDays: r.scheduledDays,
});

const toEvent = (r: typeof reviewLogs.$inferSelect): ReviewEvent => ({
  id: r.id,
  at: r.at,
  rating: r.rating,
  kind: r.kind,
  ...(r.retention ? { retention: r.retention } : {}),
});

const CHUNK = 100; // 10 colunas × 100 linhas, bem abaixo do limite de variáveis do SQLite

export class SqliteCardsRepository implements CardsRepository {
  readonly bus = new ChangeBus();

  constructor(
    private readonly db: AppDb,
    private readonly deps: RepoDeps,
  ) {}

  async get(id: Id): Promise<Card | null> {
    const rows = await this.db
      .select()
      .from(cards)
      .where(and(eq(cards.id, id), isNull(cards.deletedAt)))
      .limit(1);
    return rows[0] ? toCard(rows[0]) : null;
  }

  async save(card: Card): Promise<void> {
    await this.write([card], new Set());
  }

  async saveMany(list: readonly Card[]): Promise<void> {
    await this.write(list, new Set());
  }

  async softDelete(id: Id): Promise<void> {
    const rows = await this.db.select().from(cards).where(eq(cards.id, id)).limit(1);
    const row = rows[0];
    if (!row || row.deletedAt) return;
    const now = this.deps.clock();
    await this.write([{ ...toCard(row), deletedAt: now, updatedAt: now }], new Set([id]));
  }

  async approveDrafts(ids: readonly Id[]): Promise<void> {
    if (ids.length === 0) return;
    const rows = await this.db
      .select()
      .from(cards)
      .where(and(inArray(cards.id, [...ids]), eq(cards.status, "draft"), isNull(cards.deletedAt)));
    const now = this.deps.clock();
    await this.write(
      rows.map((r) => ({ ...toCard(r), status: "active" as const, updatedAt: now })),
      new Set(),
    );
  }

  watchDue(now: Date): Subscribable<readonly CardWithState[]> {
    return this.watch(["cards", "card_states"], async () => {
      const rows = await this.db
        .select()
        .from(cards)
        .innerJoin(cardStates, eq(cardStates.cardId, cards.id))
        .where(and(isNull(cards.deletedAt), eq(cards.status, "active"), lte(cardStates.due, now)))
        .orderBy(asc(cardStates.due), asc(cards.id));
      return rows.map((r) => ({ card: toCard(r.cards), state: toState(r.card_states) }));
    });
  }

  watchActive(): Subscribable<readonly CardWithState[]> {
    return this.watch(["cards", "card_states"], async () => {
      const rows = await this.db
        .select()
        .from(cards)
        .innerJoin(cardStates, eq(cardStates.cardId, cards.id))
        .where(and(isNull(cards.deletedAt), eq(cards.status, "active")));
      return rows.map((r) => ({ card: toCard(r.cards), state: toState(r.card_states) }));
    });
  }

  watchToday(now: Date): Subscribable<TodaySummary> {
    return this.watch(["cards", "card_states"], async () => {
      // Contagens servidas só pelos índices (is_active, retained_until); vencidos pelo índice (is_active, due).
      const [active, retained, dueRows, perCollection] = await Promise.all([
        this.db.select({ n: count() }).from(cardStates).where(eq(cardStates.isActive, 1)),
        this.db
          .select({ n: count() })
          .from(cardStates)
          .where(and(eq(cardStates.isActive, 1), gte(cardStates.retainedUntil, now))),
        this.db
          .select({
            id: cardStates.cardId,
            collectionId: cardStates.collectionId,
            importance: cardStates.importance,
            due: cardStates.due,
            stability: cardStates.stability,
            lastReview: cardStates.lastReview,
          })
          .from(cardStates)
          .where(and(eq(cardStates.isActive, 1), lte(cardStates.due, now))),
        this.db
          .select({
            collectionId: cardStates.collectionId,
            active: count(),
            retained: sql<number>`coalesce(sum(case when ${cardStates.retainedUntil} >= ${now.getTime()} then 1 else 0 end), 0)`,
          })
          .from(cardStates)
          .where(eq(cardStates.isActive, 1))
          .groupBy(cardStates.collectionId),
      ]);
      return {
        byCollection: perCollection.flatMap((r) =>
          r.collectionId === null
            ? []
            : [{ collectionId: r.collectionId, active: r.active, retained: Number(r.retained) }],
        ),
        activeCount: active[0]?.n ?? 0,
        retainedCount: retained[0]?.n ?? 0,
        dueRows,
      };
    });
  }

  async getState(cardId: Id): Promise<CardState | null> {
    const rows = await this.db.select().from(cardStates).where(eq(cardStates.cardId, cardId)).limit(1);
    return rows[0] ? toState(rows[0]) : null;
  }

  async listReviews(cardId: Id): Promise<readonly ReviewEvent[]> {
    const rows = await this.db.select().from(reviewLogs).where(eq(reviewLogs.cardId, cardId));
    return sortHistory(rows.map(toEvent));
  }

  recordReview(input: ReviewInput): Promise<void> {
    return this.enqueue(async () => {
      const cardRows = await this.db
        .select()
        .from(cards)
        .where(and(eq(cards.id, input.cardId), isNull(cards.deletedAt)))
        .limit(1);
      const cardRow = cardRows[0];
      if (!cardRow) throw new Error(`card inexistente: ${input.cardId}`);
      const stateRows = await this.db
        .select()
        .from(cardStates)
        .where(eq(cardStates.cardId, input.cardId))
        .limit(1);
      const current = stateRows[0] ? toState(stateRows[0]) : initialState(input.at);
      const event: ReviewEvent = {
        id: input.id,
        at: input.at,
        rating: input.rating,
        kind: input.kind ?? "review",
        ...(input.retention ? { retention: input.retention } : {}),
      };
      const next = applyReview(current, event, this.deps.fsrs);
      const stmts: BatchItem<"sqlite">[] = [
        this.db.insert(reviewLogs).values({
          id: event.id,
          cardId: input.cardId,
          at: input.at,
          rating: input.rating,
          retention: input.retention ?? null,
          kind: event.kind ?? "review",
        }),
      ];
      if (event.kind !== "in_session_retry")
        stmts.push(this.upsertState(input.cardId, toCard(cardRow), next));
      stmts.push(
        this.db.insert(outbox).values({
          id: this.deps.newId(),
          entity: "review",
          entityId: input.id,
          op: "upsert",
          payload: "{}",
          createdAt: this.deps.clock(),
        }),
      );
      await this.db.batch(stmts as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
      this.bus.emit(["card_states", "review_logs", "outbox"]);
    });
  }

  rebuildStates(): Promise<number> {
    return this.enqueue(async () => {
      const cardRows = await this.db
        .select()
        .from(cards)
        .where(and(isNull(cards.deletedAt), eq(cards.status, "active")));
      const logs = await this.db.select().from(reviewLogs).orderBy(asc(reviewLogs.at), asc(reviewLogs.id));
      const byCard = new Map<string, ReviewEvent[]>();
      for (const l of logs) byCard.set(l.cardId, [...(byCard.get(l.cardId) ?? []), toEvent(l)]);
      const rebuilt = rebuildCache(
        cardRows.map((r) => ({
          id: r.id,
          card: toCard(r),
          history: byCard.get(r.id) ?? [],
          createdAt: r.createdAt,
        })),
        this.deps.fsrs,
      );
      const byId = new Map(cardRows.map((r) => [r.id, toCard(r)]));
      for (let i = 0; i < rebuilt.length; i += CHUNK) {
        const part = rebuilt.slice(i, i + CHUNK);
        await this.db.batch(
          part.map((r) => this.upsertState(r.cardId, byId.get(r.cardId) as Card, r.state)) as [
            BatchItem<"sqlite">,
            ...BatchItem<"sqlite">[],
          ],
        );
      }
      this.bus.emit(["card_states"]);
      return rebuilt.length;
    });
  }

  private upsertState(cardId: Id, card: Card, state: CardState): BatchItem<"sqlite"> {
    const row = cacheRow(card, state);
    const set = {
      due: state.due,
      stability: state.stability,
      difficulty: state.difficulty,
      state: state.state,
      reps: state.reps,
      lapses: state.lapses,
      scheduledDays: state.scheduledDays,
      lastReview: state.lastReview,
      isActive: row.isActive,
      collectionId: row.collectionId,
      importance: row.importance,
      retainedUntil: row.retainedUntil === null ? null : new Date(row.retainedUntil),
    };
    return this.db
      .insert(cardStates)
      .values({ cardId, ...set })
      .onConflictDoUpdate({ target: cardStates.cardId, set });
  }

  async pendingOutbox(): Promise<readonly OutboxEntry[]> {
    const rows = await this.db.select().from(outbox).orderBy(asc(outbox.seq));
    return rows.map((r) => ({
      id: r.id,
      entity: r.entity === "review" || r.entity === "collection" ? r.entity : "card",
      entityId: r.entityId,
      op: r.op,
      createdAt: r.createdAt,
    }));
  }

  /** Escritas são serializadas: uma transação por vez, na ordem de chamada. */
  private queue: Promise<unknown> = Promise.resolve();

  private enqueue<T>(run: () => Promise<T>): Promise<T> {
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
  }

  private write(list: readonly Card[], deletedIds: ReadonlySet<Id>): Promise<void> {
    return this.enqueue(async () => {
      if (list.length === 0) return;
      const now = this.deps.clock();
      const stmts: BatchItem<"sqlite">[] = [];
      for (let i = 0; i < list.length; i += CHUNK) {
        const part = list.slice(i, i + CHUNK);
        stmts.push(
          this.db
            .insert(cards)
            .values(part.map((c) => ({ ...c, tags: [...c.tags] })))
            .onConflictDoUpdate({
              target: cards.id,
              set: {
                collectionId: sqlExcluded("collection_id"),
                front: sqlExcluded("front"),
                back: sqlExcluded("back"),
                tags: sqlExcluded("tags"),
                importance: sqlExcluded("importance"),
                status: sqlExcluded("status"),
                updatedAt: sqlExcluded("updated_at"),
                deletedAt: sqlExcluded("deleted_at"),
              },
            }),
        );
        // Estado inicial só para ativos que ainda não têm (DoNothing preserva o estado existente).
        // Estado para todo card ativo: novo = FSRS inicial; existente = só atualiza is_active e importance
        // (denormalizados para a tela Hoje), preservando o estado FSRS.
        const withState = part.filter((c) => c.status === "active");
        const inactive = part.filter((c) => c.status !== "active").map((c) => c.id);
        if (withState.length > 0) {
          const s = initialState(now);
          stmts.push(
            this.db
              .insert(cardStates)
              .values(
                withState.map((c) => ({
                  cardId: c.id,
                  ...s,
                  isActive: c.deletedAt ? 0 : 1,
                  importance: c.importance,
                  collectionId: c.collectionId,
                })),
              )
              .onConflictDoUpdate({
                target: cardStates.cardId,
                set: {
                  isActive: sqlExcluded("is_active"),
                  importance: sqlExcluded("importance"),
                  collectionId: sqlExcluded("collection_id"),
                },
              }),
          );
        }
        // Rascunho, suspenso ou problemático: sai do agendamento (se já tinha estado).
        if (inactive.length > 0)
          stmts.push(
            this.db.update(cardStates).set({ isActive: 0 }).where(inArray(cardStates.cardId, inactive)),
          );
        stmts.push(
          this.db.insert(outbox).values(
            part.map((c) => ({
              id: this.deps.newId(),
              entity: "card",
              entityId: c.id,
              op: deletedIds.has(c.id) ? ("delete" as const) : ("upsert" as const),
              payload: "{}",
              createdAt: now,
            })),
          ),
        );
      }
      await this.db.batch(stmts as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
      this.bus.emit(["cards", "card_states", "outbox"]);
    });
  }

  /** Reexecuta a consulta a cada mudança relevante; rajadas são coalescidas (a última vence). */
  private watch<T>(tables: readonly string[], query: () => Promise<T>): Subscribable<T> {
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
              const value = await query();
              if (active) onValue(value);
            } while (dirty && active);
          } catch (e) {
            if (active) onError?.(e);
          } finally {
            running = false;
          }
        };
        const off = this.bus.on((changed) => {
          if (changed.some((t) => tables.includes(t))) void refresh();
        });
        void refresh();
        return () => {
          active = false;
          off();
        };
      },
    };
  }
}

const sqlExcluded = (col: string) => sql.raw(`excluded.${col}`);
