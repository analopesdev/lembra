import fc from "fast-check";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { cacheRow, rebuildCache } from "../cache";
import {
  applyReview,
  deriveState,
  initialState,
  type CardState,
  type FsrsParams,
  type Rating,
  type ReviewEvent,
} from "../derive-state";

const vectorsFile = join(__dirname, "../../../../../../contracts/fsrs-vectors/vectors.v1.json");
const weights = (JSON.parse(readFileSync(vectorsFile, "utf8")) as { default_weights: number[] })
  .default_weights;
const params: FsrsParams = { requestRetention: 0.9, maximumInterval: 36500, enableShortTerm: false, weights };
const START = new Date("2026-01-05T07:00:00.000Z");
const DAY = 86_400_000;

// Formato do banco: datas em ms, números em REAL (doubles), como em card_states. Simula gravar e reler.
function persist(s: CardState): CardState {
  const row = JSON.parse(
    JSON.stringify({ ...s, due: s.due.getTime(), lastReview: s.lastReview?.getTime() ?? null }),
  );
  return {
    ...row,
    due: new Date(row.due),
    lastReview: row.lastReview === null ? null : new Date(row.lastReview),
  };
}

const historyArb = fc
  .array(
    fc.record({
      gap: fc.constantFrom(0, 60_000, DAY, 3 * DAY, 10 * DAY, 60 * DAY),
      rating: fc.constantFrom<Rating>(1, 2, 3, 4),
      retry: fc.boolean(),
      retention: fc.constantFrom(undefined, 0.85, 0.9, 0.95),
    }),
    { minLength: 1, maxLength: 40 },
  )
  .map((steps) => {
    let t = START.getTime();
    return steps.map<ReviewEvent>((s, i) => {
      t += s.gap;
      return {
        id: `ev-${String(i).padStart(4, "0")}`,
        at: new Date(t),
        rating: s.rating,
        kind: s.retry && i > 0 ? "in_session_retry" : "review",
        ...(s.retention ? { retention: s.retention } : {}),
      };
    });
  });

describe("cache de card_states (ADR-0032)", () => {
  it("propriedade: estado incremental (gravando e relendo a cada passo) == recálculo do zero", () => {
    fc.assert(
      fc.property(historyArb, (h) => {
        let incremental = initialState(START);
        for (const ev of h) incremental = persist(applyReview(incremental, ev, params));
        expect(incremental).toEqual(deriveState(h, params, START));
      }),
    );
  });

  it("propriedade: campos denormalizados incrementais == rebuild do zero", () => {
    const card = { status: "active" as const, deletedAt: null, importance: 2 as const };
    fc.assert(
      fc.property(historyArb, (h) => {
        let s = initialState(START);
        for (const ev of h) s = persist(applyReview(s, ev, params));
        const [entry] = rebuildCache([{ id: "c1", card, history: h, createdAt: START }], params);
        expect(cacheRow(card, s)).toEqual(entry!.row);
        expect(s).toEqual(entry!.state);
      }),
    );
  });

  it("in_session_retry não altera o estado nem o cache", () => {
    const base = applyReview(initialState(START), { id: "a", at: START, rating: 1 }, params);
    const after = applyReview(
      base,
      { id: "b", at: new Date(START.getTime() + 600_000), rating: 3, kind: "in_session_retry" },
      params,
    );
    expect(after).toBe(base);
  });

  it.each([
    ["ativo", { status: "active", deletedAt: null }, 1],
    ["suspenso", { status: "suspended", deletedAt: null }, 0],
    ["rascunho", { status: "draft", deletedAt: null }, 0],
    ["problemático", { status: "problematic", deletedAt: null }, 0],
    ["ativo mas excluído", { status: "active", deletedAt: START }, 0],
  ] as const)("is_active: %s", (_n, c, want) => {
    expect(cacheRow({ ...c, importance: 2 }, initialState(START)).isActive).toBe(want);
  });

  it("retained_until = última revisão + S dias; card novo não tem", () => {
    const card = { status: "active" as const, deletedAt: null, importance: 3 as const };
    expect(cacheRow(card, initialState(START)).retainedUntil).toBeNull();
    const s = applyReview(initialState(START), { id: "a", at: START, rating: 3 }, params);
    expect(cacheRow(card, s).retainedUntil).toBe(START.getTime() + s.stability * DAY);
    expect(cacheRow(card, s).importance).toBe(3);
  });

  it("rebuild após reotimizar os parâmetros muda S e retained_until (por isso o job é obrigatório)", () => {
    const card = { status: "active" as const, deletedAt: null, importance: 2 as const };
    const h: ReviewEvent[] = [
      { id: "a", at: START, rating: 3 },
      { id: "b", at: new Date(START.getTime() + 3 * DAY), rating: 3 },
    ];
    const novo = { ...params, weights: weights.map((w, i) => (i === 2 ? w * 1.5 : w)) };
    const [antes] = rebuildCache([{ id: "c", card, history: h, createdAt: START }], params);
    const [depois] = rebuildCache([{ id: "c", card, history: h, createdAt: START }], novo);
    expect(depois!.state.stability).not.toBe(antes!.state.stability);
    expect(depois!.row.retainedUntil).not.toEqual(antes!.row.retainedUntil);
  });
});
