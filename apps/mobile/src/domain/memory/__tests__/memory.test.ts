import fc from "fast-check";

import { retrievability } from "../../scheduling";
import { initialState } from "../../scheduling";
import { isRetained, memoryRetained, retainedUntilMs } from "../memory";

const NOW = new Date("2026-03-10T10:00:00Z");
const DAY = 86_400_000;
const W = [
  0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629,
  1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542,
];

describe("memoryRetained (RN-06)", () => {
  it.each([
    ["card novo nunca conta", { stability: 0, lastReview: null }, false],
    ["revisado há 1 dia com S=10", { stability: 10, lastReview: new Date(NOW.getTime() - DAY) }, true],
    [
      "revisado há 10 dias com S=10: no limite",
      { stability: 10, lastReview: new Date(NOW.getTime() - 10 * DAY) },
      true,
    ],
    [
      "revisado há 11 dias com S=10",
      { stability: 10, lastReview: new Date(NOW.getTime() - 11 * DAY) },
      false,
    ],
    ["S ≤ 0 não conta", { stability: 0, lastReview: NOW }, false],
  ])("%s", (_n, s, want) => expect(isRetained(s, NOW)).toBe(want));

  it("conta só os retidos", () => {
    const rows = [
      { stability: 10, lastReview: new Date(NOW.getTime() - DAY) },
      { stability: 1, lastReview: new Date(NOW.getTime() - 5 * DAY) },
      { stability: 0, lastReview: null },
    ];
    expect(memoryRetained(rows, NOW)).toBe(1);
    expect(memoryRetained([], NOW)).toBe(0);
  });

  it("retainedUntil = última revisão + S dias", () => {
    expect(retainedUntilMs({ stability: 2, lastReview: NOW })).toBe(NOW.getTime() + 2 * DAY);
    expect(retainedUntilMs({ stability: 2, lastReview: null })).toBeNull();
  });

  it("propriedade: equivale a R ≥ 90% pela curva do FSRS (fora de uma margem numérica)", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.5, max: 400, noNaN: true }),
        fc.double({ min: 0, max: 800, noNaN: true }),
        (s, t) => {
          fc.pre(Math.abs(t - s) > 1e-3);
          const state = { ...initialState(NOW), stability: s, lastReview: new Date(NOW.getTime() - t * DAY) };
          expect(isRetained(state, NOW)).toBe(retrievability(state, NOW, W) >= 0.9);
        },
      ),
    );
  });
});
