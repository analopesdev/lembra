import { readFileSync, writeFileSync } from "node:fs";

const DIR = new URL("../src/data/db/migrations/", import.meta.url);
const OUT = new URL("../src/data/db/migrations.gen.ts", import.meta.url);

const journal = JSON.parse(readFileSync(new URL("meta/_journal.json", DIR), "utf8"));
const migrations = journal.entries
  .slice()
  .sort((a, b) => a.idx - b.idx)
  .map((e) =>
    readFileSync(new URL(`${e.tag}.sql`, DIR), "utf8")
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean),
  );

writeFileSync(
  OUT,
  `export const MIGRATIONS: readonly (readonly string[])[] = ${JSON.stringify(migrations, null, 2)};\n`,
);
console.log(`${migrations.length} migração(ões) → src/data/db/migrations.gen.ts`);
