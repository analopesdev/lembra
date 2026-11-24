import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Datas em UTC, guardadas como milissegundos (RN-13). IDs são UUIDv7 em TEXT (ADR-0009).
export const cards = sqliteTable(
  "cards",
  {
    id: text("id").primaryKey(),
    collectionId: text("collection_id").notNull(),
    front: text("front").notNull(),
    back: text("back").notNull(),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull(),
    importance: integer("importance").$type<1 | 2 | 3>().notNull(),
    status: text("status").$type<"draft" | "active" | "suspended" | "problematic">().notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("idx_cards_collection").on(t.collectionId)],
);

export const collections = sqliteTable("collections", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").$type<"bone" | "heart" | "flask" | "help" | "chart" | "copy">().notNull(),
  tone: text("tone").$type<"tint" | "collection2" | "collection3">().notNull(),
  examDay: text("exam_day"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
});

// Cache do estado FSRS (RN-12): pode ser apagado e recalculado do histórico.
export const cardStates = sqliteTable(
  "card_states",
  {
    cardId: text("card_id")
      .primaryKey()
      .references(() => cards.id),
    due: integer("due", { mode: "timestamp_ms" }).notNull(),
    stability: real("stability").notNull(),
    difficulty: real("difficulty").notNull(),
    state: integer("state").$type<0 | 1 | 2 | 3>().notNull(),
    reps: integer("reps").notNull(),
    lapses: integer("lapses").notNull(),
    scheduledDays: integer("scheduled_days").notNull(),
    lastReview: integer("last_review", { mode: "timestamp_ms" }),
    // Denormalizados para a tela Hoje não precisar varrer todos os cards (spike ADR-0010):
    // is_active = card ativo e não excluído; retained_until = última revisão + S dias (R ≥ 90% até lá, RN-06).
    // importance repete cards.importance para a tela Hoje não tocar a tabela larga (front/back).
    isActive: integer("is_active").notNull().default(0),
    importance: integer("importance").$type<1 | 2 | 3>().notNull().default(2),
    collectionId: text("collection_id"),
    retainedUntil: integer("retained_until", { mode: "timestamp_ms" }),
  },
  (t) => [
    // Cobre a consulta dos vencidos da tela Hoje: só o índice é lido (menos páginas a frio no OPFS).
    index("idx_states_active_due").on(
      t.isActive,
      t.due,
      t.cardId,
      t.importance,
      t.collectionId,
      t.stability,
      t.lastReview,
    ),
    index("idx_states_active_retained").on(t.isActive, t.retainedUntil),
    index("idx_states_collection").on(t.isActive, t.collectionId, t.retainedUntil),
  ],
);

// Histórico append-only (RN-12).
export const reviewLogs = sqliteTable(
  "review_logs",
  {
    id: text("id").primaryKey(),
    cardId: text("card_id").notNull(),
    at: integer("at", { mode: "timestamp_ms" }).notNull(),
    rating: integer("rating").$type<1 | 2 | 3 | 4>().notNull(),
    // Retenção alvo usada neste agendamento (RN-05/RN-12) e tipo do evento (ADR-0031).
    retention: real("retention"),
    kind: text("kind").$type<"review" | "in_session_retry">().notNull().default("review"),
  },
  (t) => [index("idx_review_logs_card").on(t.cardId, t.at)],
);

// Outbox (ADR-0008): gravada na mesma transação que a mudança.
export const outbox = sqliteTable("outbox", {
  seq: integer("seq").primaryKey({ autoIncrement: true }),
  id: text("id").notNull().unique(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  op: text("op").$type<"upsert" | "delete">().notNull(),
  payload: text("payload").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
