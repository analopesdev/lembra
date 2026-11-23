import { drizzle, type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import * as SQLite from "expo-sqlite";

import { runMigrations } from "./migrate";
import type { MigrationExecutor } from "./migrate";
import { MIGRATIONS } from "./migrations.gen";
import * as schema from "./schema";

export type AppDb = SqliteRemoteDatabase<typeof schema>;
export interface OpenedDb {
  readonly db: AppDb;
  close(): Promise<void>;
}

type Method = "run" | "all" | "values" | "get";

async function exec(sqlite: SQLite.SQLiteDatabase, sql: string, params: unknown[], method: Method) {
  const stmt = await sqlite.prepareAsync(sql);
  try {
    if (method === "run") {
      await stmt.executeAsync(params as SQLite.SQLiteBindValue[]);
      return { rows: [] as unknown[] };
    }
    const res = await stmt.executeForRawResultAsync(params as SQLite.SQLiteBindValue[]);
    const rows = (await res.getAllAsync()) as unknown[][];
    return { rows: method === "get" ? (rows[0] as unknown[]) : rows };
  } finally {
    await stmt.finalizeAsync();
  }
}

function executorFor(sqlite: SQLite.SQLiteDatabase): MigrationExecutor {
  return {
    userVersion: async () =>
      (await sqlite.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version ?? 0,
    exec: (sql) => sqlite.execAsync(sql),
    transaction: (task) => sqlite.withTransactionAsync(task),
  };
}

/**
 * Abre o banco local. Mesmo código nas três plataformas: `expo-sqlite` usa SQLite nativo no mobile
 * e wa-sqlite + OPFS em worker na web. Drizzle roda sobre o driver assíncrono (`sqlite-proxy`),
 * para nunca bloquear a thread de UI.
 */
export async function openDb(name: string): Promise<OpenedDb> {
  const sqlite = await SQLite.openDatabaseAsync(name);
  // O cache padrão (2 MB) é menor que o conjunto de trabalho com 10 mil cards e faz cada consulta reler
  // páginas do OPFS (~1 s). 64 MB só são alocados se usados (spike ADR-0010).
  await sqlite.execAsync("PRAGMA foreign_keys = ON; PRAGMA cache_size = -65536;");
  await runMigrations(executorFor(sqlite), MIGRATIONS);
  const db = drizzle<typeof schema>(
    (sql, params, method) => exec(sqlite, sql, params, method),
    // `db.batch` = uma transação atômica: se uma instrução falha, nada é gravado.
    async (queries) => {
      const out: { rows: unknown[] }[] = [];
      await sqlite.withTransactionAsync(async () => {
        for (const q of queries) out.push(await exec(sqlite, q.sql, q.params, q.method));
      });
      return out;
    },
    { schema },
  );
  return { db, close: () => sqlite.closeAsync() };
}
