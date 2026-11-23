// Migrações do banco local, em SQL puro, aplicadas por ordem via PRAGMA user_version.
// SPIKE: o migrador do drizzle-kit entra na Etapa 2; o SQL abaixo espelha schema.ts.
export const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE cards (
    id TEXT PRIMARY KEY NOT NULL,
    collection_id TEXT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    tags TEXT NOT NULL,
    importance INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER
  );
  CREATE INDEX idx_cards_collection ON cards (collection_id);
  CREATE TABLE card_states (
    card_id TEXT PRIMARY KEY NOT NULL REFERENCES cards(id),
    due INTEGER NOT NULL,
    stability REAL NOT NULL,
    difficulty REAL NOT NULL,
    state INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    lapses INTEGER NOT NULL,
    scheduled_days INTEGER NOT NULL,
    last_review INTEGER,
    is_active INTEGER NOT NULL DEFAULT 0,
    importance INTEGER NOT NULL DEFAULT 2,
    retained_until INTEGER
  );
  CREATE INDEX idx_states_active_due ON card_states (is_active, due, card_id, importance, stability, last_review);
  CREATE INDEX idx_states_active_retained ON card_states (is_active, retained_until);
  CREATE TABLE review_logs (
    id TEXT PRIMARY KEY NOT NULL,
    card_id TEXT NOT NULL,
    at INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    retention REAL
  );
  CREATE INDEX idx_review_logs_card ON review_logs (card_id, at);
  CREATE TABLE outbox (
    seq INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    id TEXT NOT NULL UNIQUE,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    op TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  `,
];
