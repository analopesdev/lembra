import { readFileSync } from "node:fs";
import { join } from "node:path";

import { deriveState, type FsrsParams, type Rating } from "../derive-state";

interface VectorFile {
  version: number;
  tolerance: { float: number };
  default_weights: number[];
  params: Record<string, { request_retention: number; maximum_interval: number; enable_short_term: boolean }>;
  cases: {
    name: string;
    params: string;
    weights?: number[];
    reviews: { at: string; rating: number; retention?: number }[];
    expected: {
      due: string;
      stability: number;
      difficulty: number;
      state: number;
      reps: number;
      lapses: number;
      scheduled_days: number;
      last_review: string;
    }[];
  }[];
}

const file = join(__dirname, "../../../../../../contracts/fsrs-vectors/vectors.v1.json");
const vectors = JSON.parse(readFileSync(file, "utf8")) as VectorFile;

// Conformidade (ADR-0006): o wrapper reproduz, a cada prefixo do histórico, os estados dos vetores.
// Os vetores foram gerados com o próprio ts-fsrs, então aqui a comparação é exata; o Go roda os mesmos vetores.
describe("conformidade FSRS com contracts/fsrs-vectors", () => {
  it("tem vetores", () => {
    expect(vectors.version).toBe(1);
    expect(vectors.cases.length).toBeGreaterThanOrEqual(80);
  });

  it.each(vectors.cases.map((c) => [c.name, c] as const))("%s", (_name, c) => {
    const ps = vectors.params[c.params]!;
    const params: FsrsParams = {
      requestRetention: ps.request_retention,
      maximumInterval: ps.maximum_interval,
      enableShortTerm: ps.enable_short_term,
      weights: c.weights ?? vectors.default_weights,
    };
    const history = c.reviews.map((r, i) => ({
      id: String(i).padStart(6, "0"),
      at: new Date(r.at),
      rating: r.rating as Rating,
      ...(r.retention ? { retention: r.retention } : {}),
    }));
    const start = new Date(c.reviews[0]!.at);
    for (let i = 0; i < history.length; i++) {
      const got = deriveState(history.slice(0, i + 1), params, start);
      const want = c.expected[i]!;
      expect({
        due: got.due.toISOString(),
        lastReview: got.lastReview?.toISOString(),
        state: got.state,
        reps: got.reps,
        lapses: got.lapses,
        scheduledDays: got.scheduledDays,
      }).toEqual({
        due: want.due,
        lastReview: want.last_review,
        state: want.state,
        reps: want.reps,
        lapses: want.lapses,
        scheduledDays: want.scheduled_days,
      });
      expect(Math.abs(got.stability - want.stability)).toBeLessThanOrEqual(vectors.tolerance.float);
      expect(Math.abs(got.difficulty - want.difficulty)).toBeLessThanOrEqual(vectors.tolerance.float);
    }
  });
});
