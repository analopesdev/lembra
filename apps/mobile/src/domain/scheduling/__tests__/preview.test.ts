import { defaultParams, initialState } from "../derive-state";
import { previewIntervals } from "../preview";

const NOW = new Date("2026-03-10T15:00:00Z");
const TZ = "America/Sao_Paulo";

describe("previewIntervals", () => {
  it("card novo: intervalos não decrescem de Errei a Fácil", () => {
    const p = previewIntervals(initialState(NOW), NOW, defaultParams(), TZ);
    expect(p[1]).toBeLessThanOrEqual(p[2]);
    expect(p[2]).toBeLessThanOrEqual(p[3]);
    expect(p[3]).toBeLessThanOrEqual(p[4]);
    expect(p[4]).toBeGreaterThanOrEqual(1);
  });

  it("card maduro: Bom e Fácil voltam em dias, Fácil depois de Bom", () => {
    const state = {
      ...initialState(NOW),
      lastReview: new Date("2026-02-10T15:00:00Z"),
      stability: 20,
      difficulty: 5,
      state: 2 as const,
      reps: 4,
      scheduledDays: 20,
    };
    const p = previewIntervals(state, NOW, defaultParams(), TZ);
    expect(p[3]).toBeGreaterThan(5);
    expect(p[4]).toBeGreaterThan(p[3]);
    expect(p[1]).toBeLessThan(p[3]);
  });

  it("é pura: não altera o estado recebido", () => {
    const state = initialState(NOW);
    const copy = JSON.stringify(state);
    previewIntervals(state, NOW, defaultParams(), TZ);
    expect(JSON.stringify(state)).toBe(copy);
  });
});
