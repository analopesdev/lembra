import { drizzle, type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import * as SQLite from "expo-sqlite";

import { MIGRATIONS } from "./migrations";
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

async function migrate(sqlite: SQLite.SQLiteDatabase): Promise<void> {
  const row = await sqlite.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    await sqlite.withTransactionAsync(async () => {
      await sqlite.execAsync(MIGRATIONS[v] as string);
      await sqlite.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
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
  await migrate(sqlite);
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
