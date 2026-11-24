// SPIKE (ADR-0010): executa o contrato e as medições no ambiente real (navegador com OPFS ou nativo).
import { sql } from "drizzle-orm";
import * as SQLite from "expo-sqlite";

import { openDb } from "@/data/db/client";
import { cardsContract, type ContractEnv } from "@/data/repositories/cards.contract";
import type { RepoDeps } from "@/data/repositories/cards.memory";
import type { TodaySummary } from "@/data/repositories/cards";
import { SqliteCardsRepository } from "@/data/repositories/cards.sqlite";
import { collectionsContract } from "@/data/repositories/collections.contract";
import { SqliteCollectionsRepository } from "@/data/repositories/collections.sqlite";
import { settingsContract } from "@/data/repositories/settings.contract";
import { SqliteSettingsRepository } from "@/data/repositories/settings.sqlite";
import { defaultParams, initialState, retrievability } from "@/domain/scheduling";
import type { Card } from "@/domain/types";
import { cryptoRandomBytes, uuidv7 } from "@/shared/lib/uuidv7";

import { seedCards } from "./seed";

const W = [
  0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629,
  1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542,
];
const NOW = new Date("2026-03-10T10:00:00.000Z");
const EMPTY_STATE = initialState(NOW);
const I_WEIGHT = { 1: 1, 2: 1.5, 3: 2 } as const;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
const ms = (t: number) => Math.round(t * 10) / 10;

function deps(): { deps: RepoDeps; env: Pick<ContractEnv, "setNow" | "duplicateNextOutboxId"> } {
  let now = NOW;
  let last = "";
  let dup = false;
  return {
    deps: {
      clock: () => now,
      fsrs: defaultParams(),
      newId: () => {
        if (dup && last) {
          dup = false;
          return last;
        }
        last = uuidv7(Date.now(), cryptoRandomBytes);
        return last;
      },
    },
    env: { setNow: (d) => (now = d), duplicateNextOutboxId: () => (dup = true) },
  };
}

export interface ContractReport {
  passed: number;
  failed: { name: string; error: string }[];
}

export async function runContract(): Promise<ContractReport> {
  const report: ContractReport = { passed: 0, failed: [] };
  for (const [i, c] of cardsContract.entries()) {
    const name = `spike-contract-${i}.db`;
    let close: (() => Promise<void>) | null = null;
    try {
      const opened = await openDb(name);
      close = opened.close;
      const d = deps();
      const repo = new SqliteCardsRepository(opened.db, d.deps);
      await c.run({ repo, ...d.env });
      report.passed++;
    } catch (e) {
      report.failed.push({ name: c.name, error: e instanceof Error ? e.message : String(e) });
    } finally {
      try {
        await close?.();
        await SQLite.deleteDatabaseAsync(name);
      } catch (e) {
        report.failed.push({ name: `limpeza: ${c.name}`, error: e instanceof Error ? e.message : String(e) });
      }
    }
  }
  for (const [i, c] of collectionsContract.entries()) {
    const name = `spike-collections-${i}.db`;
    const { db, close } = await openDb(name);
    const d = deps();
    const repo = new SqliteCollectionsRepository(db, d.deps);
    try {
      await c.run({ repo, ...d.env });
      report.passed++;
    } catch (e) {
      report.failed.push({ name: `coleções: ${c.name}`, error: e instanceof Error ? e.message : String(e) });
    } finally {
      await close();
      await SQLite.deleteDatabaseAsync(name);
    }
  }
  for (const [i, c] of settingsContract.entries()) {
    const name = `spike-settings-${i}.db`;
    const { db, close } = await openDb(name);
    const repo = new SqliteSettingsRepository(db, deps().deps);
    try {
      await c.run({ repo });
      report.passed++;
    } catch (e) {
      report.failed.push({ name: `ajustes: ${c.name}`, error: e instanceof Error ? e.message : String(e) });
    } finally {
      await close();
      await SQLite.deleteDatabaseAsync(name);
    }
  }
  return report;
}

/** Tela Hoje: memória retida (RN-06, já contada no banco), vencidos e ordem por valor (RN-01). */
function computeTodayFromSummary(summary: TodaySummary, now: Date) {
  const values: { id: string; v: number }[] = [];
  for (const row of summary.dueRows) {
    const r = retrievability(
      { ...EMPTY_STATE, stability: row.stability, lastReview: row.lastReview },
      now,
      W,
    );
    values.push({ id: row.id, v: (1 - r) * I_WEIGHT[row.importance] });
  }
  values.sort((a, b) => b.v - a.v || (a.id < b.id ? -1 : 1));
  return { retained: summary.retainedCount, due: summary.dueRows.length, top: values.slice(0, 30).length };
}

export async function runSeed(n: number) {
  const t0 = performance.now();
  await SQLite.deleteDatabaseAsync("spike-bench.db").catch(() => undefined);
  const { db, close } = await openDb("spike-bench.db");
  const openMs = performance.now() - t0;
  const d = deps();
  const repo = new SqliteCardsRepository(db, d.deps);
  const seed = await seedCards(repo, db, n, NOW);
  await close();
  return { cards: n, openMs: ms(openMs), seedCardsMs: ms(seed.cardsMs), seedStatesMs: ms(seed.statesMs) };
}

export async function runToday() {
  const tOpen = performance.now();
  const { db, close } = await openDb("spike-bench.db");
  const openMs = performance.now() - tOpen;
  const d = deps();
  const repo = new SqliteCardsRepository(db, d.deps);
  const first = <T>(src: { subscribe(f: (v: T) => void, e?: (x: unknown) => void): () => void }) =>
    new Promise<T>((resolve, reject) => {
      const off = src.subscribe((v) => {
        queueMicrotask(off);
        resolve(v);
      }, reject);
    });

  // Custo de primeira chamada (inicialização) separado da consulta em si.
  const tw = performance.now();
  await db.all(sql`SELECT 1`);
  const firstCallMs = performance.now() - tw;

  // Tela Hoje a frio (primeira leitura depois de abrir o banco): contagens indexadas + só os vencidos.
  const t1 = performance.now();
  const summary = await first(repo.watchToday(NOW));
  const todayQueryColdMs = performance.now() - t1;
  const t2 = performance.now();
  const today = computeTodayFromSummary(summary, NOW);
  const computeMs = performance.now() - t2;
  const todayReadyMs = performance.now() - tOpen;
  // Tempo desde o início da navegação até os números da tela Hoje prontos (inclui bundle JS, wasm e worker).
  const pageToTodayMs = performance.now();

  const t3 = performance.now();
  await first(repo.watchToday(NOW));
  const todayQueryWarmMs = performance.now() - t3;
  // Lista completa (com texto), usada por listas de cards: custo proporcional ao total.
  const t4 = performance.now();
  const full = await first(repo.watchActive());
  const fullColdMs = performance.now() - t4;
  const t5 = performance.now();
  await first(repo.watchActive());
  const fullWarmMs = performance.now() - t5;

  // CRUD em banco ocioso (sem assinaturas ativas).
  const crud = {
    insert: [] as number[],
    update: [] as number[],
    get: [] as number[],
    softDelete: [] as number[],
  };
  for (let i = 0; i < 15; i++) {
    const id = `0191${String(i).padStart(4, "0")}-0000-7000-8000-${String(i).padStart(12, "0")}`;
    const card: Card = {
      id,
      collectionId: "col-1",
      front: "novo",
      back: "novo",
      tags: [],
      importance: 2,
      status: "active",
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    };
    let t = performance.now();
    await repo.save(card);
    crud.insert.push(performance.now() - t);
    t = performance.now();
    await repo.save({ ...card, front: "editado" });
    crud.update.push(performance.now() - t);
    t = performance.now();
    await repo.get(id);
    crud.get.push(performance.now() - t);
    t = performance.now();
    await repo.softDelete(id);
    crud.softDelete.push(performance.now() - t);
  }

  // Reatividade: com a assinatura do Hoje ativa (10 mil linhas), escrita → nova emissão.
  const latencies: number[] = [];
  let resolveNext: (() => void) | null = null;
  const off = repo.watchToday(NOW).subscribe(() => resolveNext?.());
  await new Promise((r) => setTimeout(r, 300));
  for (let i = 100; i < 110; i++) {
    const id = `0192${String(i).padStart(4, "0")}-0000-7000-8000-${String(i).padStart(12, "0")}`;
    const card: Card = {
      id,
      collectionId: "col-1",
      front: "x",
      back: "x",
      tags: [],
      importance: 2,
      status: "active",
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    };
    const emitted = new Promise<void>((r) => (resolveNext = r));
    const t = performance.now();
    await repo.save(card);
    await emitted;
    latencies.push(performance.now() - t);
    await new Promise((r) => setTimeout(r, 100));
  }
  off();
  await close();
  return {
    active: full.length,
    openMs: ms(openMs),
    firstCallMs: ms(firstCallMs),
    todayQueryColdMs: ms(todayQueryColdMs),
    todayQueryWarmMs: ms(todayQueryWarmMs),
    computeMs: ms(computeMs),
    todayReadyMs: ms(todayReadyMs),
    pageToTodayMs: ms(pageToTodayMs),
    today,
    fullListColdMs: ms(fullColdMs),
    fullListWarmMs: ms(fullWarmMs),
    reactiveLatencyMedianMs: ms(median(latencies)),
    reactiveLatencyMaxMs: ms(Math.max(...latencies)),
    crudMedianMs: {
      insert: ms(median(crud.insert)),
      update: ms(median(crud.update)),
      get: ms(median(crud.get)),
      softDelete: ms(median(crud.softDelete)),
    },
  };
}

/** Sondagem de plano e custo frio de cada consulta da tela Hoje (spike). */
export async function runProbe() {
  const { db, close } = await openDb("spike-bench.db");
  const out: Record<string, unknown> = {};
  const NOWMS = NOW.getTime();
  const t = async (name: string, q: ReturnType<typeof sql>) => {
    const t0 = performance.now();
    const rows = await db.all(q);
    out[name] = { ms: ms(performance.now() - t0), n: rows.length };
  };
  const plan = async (name: string, q: string) => {
    out[name] = (await db.all(sql.raw(`EXPLAIN QUERY PLAN ${q}`))).map((r) => (r as unknown[])[3]);
  };
  const Q_ACTIVE = `SELECT count(*) FROM card_states WHERE is_active = 1`;
  const Q_RETAINED = `SELECT count(*) FROM card_states WHERE is_active = 1 AND retained_until >= ${NOWMS}`;
  const Q_DUE = `SELECT c.id, c.importance, s.due, s.stability, s.last_review FROM card_states s JOIN cards c ON c.id = s.card_id WHERE s.is_active = 1 AND s.due <= ${NOWMS}`;
  await plan("plan_active", Q_ACTIVE);
  await plan("plan_retained", Q_RETAINED);
  await plan("plan_due", Q_DUE);
  await t("1_trivial_select1", sql`SELECT 1`);
  await t("2_count_active", sql.raw(Q_ACTIVE));
  await t("3_count_retained", sql.raw(Q_RETAINED));
  await t("4_due_join_rows", sql.raw(Q_DUE));
  await t("5_due_join_again", sql.raw(Q_DUE));
  await t(
    "6_due_only_states",
    sql.raw(
      `SELECT s.card_id, s.due, s.stability, s.last_review FROM card_states s WHERE s.is_active = 1 AND s.due <= ${NOWMS}`,
    ),
  );
  out.pages = await db.all(
    sql`SELECT (SELECT page_count FROM pragma_page_count) AS pages, (SELECT page_size FROM pragma_page_size) AS page_size`,
  );
  out.sizes = await db
    .all(sql`SELECT name, sum(pgsize) AS bytes FROM dbstat GROUP BY name ORDER BY bytes DESC LIMIT 12`)
    .catch((e: unknown) => String(e));
  await close();
  return out;
}
