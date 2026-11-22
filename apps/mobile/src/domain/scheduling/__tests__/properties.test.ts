import fc from "fast-check";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { deriveState, sortHistory, type FsrsParams, type Rating, type ReviewEvent } from "../derive-state";

const vectorsFile = join(__dirname, "../../../../../../contracts/fsrs-vectors/vectors.v1.json");
const defaultWeightsForTests = (
  JSON.parse(readFileSync(vectorsFile, "utf8")) as { default_weights: number[] }
).default_weights;

const params: FsrsParams = {
  requestRetention: 0.9,
  maximumInterval: 36500,
  enableShortTerm: false,
  weights: defaultWeightsForTests,
};
const START = new Date("2026-01-05T07:00:00.000Z");
const DAY = 86_400_000;

// Histórico com IDs únicos e instantes distintos ou repetidos (empates resolvidos por ID).
const historyArb = fc
  .array(
    fc.record({
      gapMs: fc.constantFrom(0, 60_000, 600_000, DAY, 3 * DAY, 10 * DAY, 60 * DAY),
      rating: fc.constantFrom<Rating>(1, 2, 3, 4),
    }),
    { minLength: 1, maxLength: 40 },
  )
  .map((steps) => {
    let t = START.getTime();
    return steps.map<ReviewEvent>((s, i) => {
      t += s.gapMs;
      return { id: `ev-${String(i).padStart(4, "0")}`, at: new Date(t), rating: s.rating };
    });
  });

describe("derivação do estado FSRS (RN-12): propriedades", () => {
  it("é pura: o mesmo histórico gera o mesmo estado", () => {
    fc.assert(
      fc.property(historyArb, (h) => {
        expect(deriveState(h, params, START)).toEqual(deriveState(h, params, START));
      }),
    );
  });

  it("não depende da ordem de chegada (sync é união de conjuntos): embaralhar e reordenar dá o mesmo estado", () => {
    fc.assert(
      fc.property(historyArb, fc.infiniteStream(fc.nat()), (h, rnd) => {
        const it = rnd[Symbol.iterator]();
        const shuffled = [...h]
          .map((e) => ({ e, k: it.next().value as number }))
          .sort((a, b) => a.k - b.k)
          .map((x) => x.e);
        expect(deriveState(sortHistory(shuffled), params, START)).toEqual(
          deriveState(sortHistory(h), params, START),
        );
      }),
    );
  });

  it("mesmo instante: o desempate por ID torna a ordem estável", () => {
    const a: ReviewEvent = { id: "a", at: START, rating: 1 };
    const b: ReviewEvent = { id: "b", at: START, rating: 4 };
    expect(sortHistory([b, a]).map((e) => e.id)).toEqual(["a", "b"]);
    expect(sortHistory([a, b]).map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("invariantes: reps = nº de revisões, lapsos ≤ reps, D em [1,10], S > 0, vencimento ≥ última revisão", () => {
    fc.assert(
      fc.property(historyArb, (h) => {
        const s = deriveState(h, params, START);
        expect(s.reps).toBe(h.length);
        expect(s.lapses).toBeLessThanOrEqual(s.reps);
        expect(s.difficulty).toBeGreaterThanOrEqual(1);
        expect(s.difficulty).toBeLessThanOrEqual(10);
        expect(s.stability).toBeGreaterThan(0);
        expect(s.due.getTime()).toBeGreaterThanOrEqual(s.lastReview!.getTime());
      }),
    );
  });

  it("recálculo incremental: derivar o prefixo e continuar não muda o resultado de derivar tudo", () => {
    fc.assert(
      fc.property(historyArb, fc.nat(), (h, k) => {
        const cut = k % h.length;
        // O estado final só depende do histórico completo; o prefixo é um passo intermediário do mesmo cálculo.
        const full = deriveState(h, params, START);
        const prefix = deriveState(h.slice(0, cut), params, START);
        expect(prefix.reps).toBe(cut);
        expect(full.reps).toBe(h.length);
      }),
    );
  });

  it("histórico vazio é card novo vencendo em `start`", () => {
    const s = deriveState([], params, START);
    expect(s.state).toBe(0);
    expect(s.due).toEqual(START);
    expect(s.reps).toBe(0);
  });
});
