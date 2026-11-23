import { DatabaseNewerThanAppError, runMigrations, type MigrationExecutor } from "../migrate";
import { MIGRATIONS } from "../migrations.gen";

function fake(initialVersion: number, failOn?: string) {
  const log: string[] = [];
  let version = initialVersion;
  let pending: string[] = [];
  const executor: MigrationExecutor = {
    userVersion: async () => version,
    exec: async (sql) => {
      if (failOn && sql.includes(failOn)) throw new Error("falha simulada");
      pending.push(sql);
    },
    transaction: async (task) => {
      pending = [];
      await task();
      for (const sql of pending) {
        log.push(sql);
        const m = /PRAGMA user_version = (\d+)/.exec(sql);
        if (m) version = Number(m[1]);
      }
    },
  };
  return { executor, log, version: () => version };
}

const M: readonly (readonly string[])[] = [
  ["CREATE TABLE a (x)", "CREATE INDEX i ON a (x)"],
  ["ALTER TABLE a ADD y"],
  ["CREATE TABLE b (z)"],
];

describe("runMigrations", () => {
  it("banco novo aplica todas, em ordem, e grava a versão a cada migração", async () => {
    const f = fake(0);
    expect(await runMigrations(f.executor, M)).toBe(3);
    expect(f.log).toEqual([
      "CREATE TABLE a (x)",
      "CREATE INDEX i ON a (x)",
      "PRAGMA user_version = 1",
      "ALTER TABLE a ADD y",
      "PRAGMA user_version = 2",
      "CREATE TABLE b (z)",
      "PRAGMA user_version = 3",
    ]);
    expect(f.version()).toBe(3);
  });

  it("banco na versão intermediária aplica só as que faltam", async () => {
    const f = fake(2);
    expect(await runMigrations(f.executor, M)).toBe(1);
    expect(f.log).toEqual(["CREATE TABLE b (z)", "PRAGMA user_version = 3"]);
  });

  it("é idempotente: banco em dia não aplica nada", async () => {
    const f = fake(3);
    expect(await runMigrations(f.executor, M)).toBe(0);
    expect(f.log).toEqual([]);
  });

  it("falha no meio não avança a versão nem deixa a migração pela metade", async () => {
    const f = fake(0, "ALTER");
    await expect(runMigrations(f.executor, M)).rejects.toThrow("falha simulada");
    expect(f.version()).toBe(1);
    expect(f.log).not.toContain("ALTER TABLE a ADD y");
  });

  it("banco mais novo que o app é recusado, sem tocar em nada (RNF-07)", async () => {
    const f = fake(4);
    await expect(runMigrations(f.executor, M)).rejects.toBeInstanceOf(DatabaseNewerThanAppError);
    expect(f.log).toEqual([]);
  });
});

describe("migrações geradas pelo drizzle-kit", () => {
  it("existem e criam as quatro tabelas e os índices do caminho quente", () => {
    const sql = MIGRATIONS.flat().join("\n");
    for (const t of ["cards", "card_states", "review_logs", "outbox"])
      expect(sql).toContain(`CREATE TABLE \`${t}\``);
    expect(sql).toContain("idx_states_active_due");
    expect(sql).toContain("idx_states_active_retained");
    expect(sql).toContain("`kind` text DEFAULT 'review' NOT NULL");
  });
});
