import fc from "fast-check";

import { addDays } from "../../study-day/study-day";
import { computeStreak } from "../streak";
import type { DayStatus } from "../valid-day";

// 2026-03-09 é segunda-feira.
const MON = "2026-03-09";
const d = (n: number) => addDays(MON, n);
const days = (...s: (DayStatus | "x")[]) =>
  Object.fromEntries(s.flatMap((v, i) => (v === "x" ? [] : [[d(i), v]]))) as Record<string, DayStatus>;
const V = "valid" as const;
const I = "invalid" as const;
const N = "neutral" as const;

describe("computeStreak (RF-37, RF-38)", () => {
  it.each([
    ["dias válidos seguidos", days(V, V, V), d(2), [], 3, 2],
    ["hoje ainda pendente não quebra nem conta", days(V, V), d(2), [], 2, 2],
    ["um dia sem estudo gasta 1 congelamento e mantém", days(V, I, V), d(2), [], 2, 1],
    ["dois dias sem estudo na semana: 2 congelamentos", days(V, I, I, V), d(3), [], 2, 0],
    ["terceiro dia sem estudo na mesma semana zera", days(V, I, I, I, V), d(4), [], 1, 0],
    [
      "congelamentos voltam na semana seguinte (segunda a domingo)",
      days(V, I, I, V, V, V, V, V, I, V),
      d(9),
      [],
      7,
      1,
    ],
    ["folga planejada não quebra nem gasta congelamento", days(V, I, V), d(2), [2], 2, 2],
    ["folga planejada estudada conta", days(V, V, V), d(2), [2], 3, 2],
    ["dia neutro não quebra, não gasta e não conta", days(V, N, V), d(2), [], 2, 2],
    ["dia sem registro é sem estudo (gasta congelamento)", days(V, "x", V), d(2), [], 2, 1],
    ["sem nenhum registro", {}, d(2), [], 0, 2],
    ["só hoje válido", days("x", "x", V), d(2), [], 1, 2],
  ])("%s", (_n, input, today, off, streak, left) => {
    expect(computeStreak({ days: input, today, offWeekdays: off })).toEqual({
      streak,
      freezesLeftThisWeek: left,
    });
  });

  it("depois de zerar, a sequência recomeça do próximo dia válido", () => {
    const r = computeStreak({ days: days(V, V, I, I, I, V, V), today: d(6), offWeekdays: [] });
    expect(r.streak).toBe(2);
  });

  it("propriedade: a sequência nunca passa do número de dias válidos e nunca é negativa", () => {
    const status = fc.constantFrom<DayStatus>("valid", "invalid", "neutral");
    fc.assert(
      fc.property(
        fc.array(status, { minLength: 1, maxLength: 60 }),
        fc.array(fc.integer({ min: 1, max: 7 }), { maxLength: 3 }),
        (list, off) => {
          const input = Object.fromEntries(list.map((s, i) => [d(i), s])) as Record<string, DayStatus>;
          const r = computeStreak({ days: input, today: d(list.length - 1), offWeekdays: off });
          expect(r.streak).toBeGreaterThanOrEqual(0);
          expect(r.streak).toBeLessThanOrEqual(list.filter((s) => s === "valid").length);
          expect(r.freezesLeftThisWeek).toBeGreaterThanOrEqual(0);
          expect(r.freezesLeftThisWeek).toBeLessThanOrEqual(2);
        },
      ),
    );
  });
});
