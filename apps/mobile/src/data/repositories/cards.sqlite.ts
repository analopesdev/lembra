import { and, asc, count, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

import { initialState, type CardState } from "@/domain/scheduling";
import type { Card, CardWithState, Id } from "@/domain/types";

import { ChangeBus } from "../db/change-bus";
import type { AppDb } from "../db/client";
import { cardStates, cards, outbox } from "../db/schema";
import type { CardsRepository, OutboxEntry, Subscribable, TodaySummary } from "./cards";
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
      const [active, retained, dueRows] = await Promise.all([
        this.db.select({ n: count() }).from(cardStates).where(eq(cardStates.isActive, 1)),
        this.db
          .select({ n: count() })
          .from(cardStates)
          .where(and(eq(cardStates.isActive, 1), gte(cardStates.retainedUntil, now))),
        this.db
          .select({
            id: cardStates.cardId,
            importance: cardStates.importance,
            due: cardStates.due,
            stability: cardStates.stability,
            lastReview: cardStates.lastReview,
          })
          .from(cardStates)
          .where(and(eq(cardStates.isActive, 1), lte(cardStates.due, now))),
      ]);
      return { activeCount: active[0]?.n ?? 0, retainedCount: retained[0]?.n ?? 0, dueRows };
    });
  }

  async pendingOutbox(): Promise<readonly OutboxEntry[]> {
    const rows = await this.db.select().from(outbox).orderBy(asc(outbox.seq));
    return rows.map((r) => ({
      id: r.id,
      entity: "card",
      entityId: r.entityId,
      op: r.op,
      createdAt: r.createdAt,
    }));
  }

  /** Escritas são serializadas: uma transação por vez, na ordem de chamada. */
  private queue: Promise<unknown> = Promise.resolve();

  private write(list: readonly Card[], deletedIds: ReadonlySet<Id>): Promise<void> {
    const run = async () => {
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
                })),
              )
              .onConflictDoUpdate({
                target: cardStates.cardId,
                set: { isActive: sqlExcluded("is_active"), importance: sqlExcluded("importance") },
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
    };
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
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
