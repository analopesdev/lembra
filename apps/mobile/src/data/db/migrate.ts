export interface MigrationExecutor {
  userVersion(): Promise<number>;
  exec(sql: string): Promise<void>;
  transaction(task: () => Promise<void>): Promise<void>;
}

export class DatabaseNewerThanAppError extends Error {
  constructor(
    readonly databaseVersion: number,
    readonly appVersion: number,
  ) {
    super(`banco na versão ${databaseVersion}, mas este app só conhece até ${appVersion}`);
    this.name = "DatabaseNewerThanAppError";
  }
}

export async function runMigrations(
  executor: MigrationExecutor,
  migrations: readonly (readonly string[])[],
): Promise<number> {
  const current = await executor.userVersion();
  if (current > migrations.length) throw new DatabaseNewerThanAppError(current, migrations.length);
  let applied = 0;
  for (let version = current; version < migrations.length; version++) {
    await executor.transaction(async () => {
      for (const statement of migrations[version] ?? []) await executor.exec(statement);
      await executor.exec(`PRAGMA user_version = ${version + 1}`);
    });
    applied++;
  }
  return applied;
}
