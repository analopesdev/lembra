import fc from "fast-check";

import {
  buildSession,
  daysToClearDebt,
  debtSlots,
  isOverdue,
  newCardsAllowed,
  sessionCapacity,
} from "../session";

describe("capacidade e dívida (RN-02)", () => {
  it.each([
    [10, 15, 40],
    [5, 15, 20],
    [20, 30, 40],
    [10, 0, 0],
    [0, 15, 0],
  ])("%s min a %s s/card = %s cards", (m, s, n) => expect(sessionCapacity(m, s)).toBe(n));

  it("usa 15 s por card no início", () => expect(sessionCapacity(10)).toBe(40));
  it.each([
    [40, 12],
    [20, 6],
    [3, 0],
  ])("30%% de %s = %s", (c, n) => expect(debtSlots(c)).toBe(n));

  it.each([
    [0, 40, 0],
    [12, 40, 1],
    [13, 40, 2],
    [120, 40, 10],
    [5, 3, Number.POSITIVE_INFINITY],
  ])("dívida %s, capacidade %s → %s dias", (d, c, n) => expect(daysToClearDebt(d, c)).toBe(n));

  it("sem card novo enquanto houver dívida", () => {
    expect([0, 1, 50].map(newCardsAllowed)).toEqual([true, false, false]);
  });

  it("atrasado = vencimento em dia de estudo anterior (fuso e virada das 4h)", () => {
    const tz = "America/Sao_Paulo";
    expect(isOverdue(new Date("2026-03-10T05:00:00Z"), "2026-03-10", tz)).toBe(true); // 02:00 local = dia 09
    expect(isOverdue(new Date("2026-03-10T08:00:00Z"), "2026-03-10", tz)).toBe(false); // 05:00 local = dia 10
  });
});

describe("buildSession", () => {
  const c = (id: string, value: number, overdue = false) => ({ id, value, overdue });

  it("pega por maior V até a capacidade, empate por ID", () => {
    const out = buildSession([c("b", 1), c("a", 1), c("c", 3), c("d", 0.5)], 3);
    expect(out.map((x) => x.id)).toEqual(["c", "a", "b"]);
  });

  it("atrasados ocupam no máximo 30% das vagas, os de maior V primeiro", () => {
    const items = [
      ...Array.from({ length: 20 }, (_, i) => c(`o${String(i).padStart(2, "0")}`, 10 - i * 0.1, true)),
      ...Array.from({ length: 20 }, (_, i) => c(`n${String(i).padStart(2, "0")}`, 1 - i * 0.01)),
    ];
    const out = buildSession(items, 10); // 30% de 10 = 3
    expect(out.filter((x) => x.overdue).map((x) => x.id)).toEqual(["o00", "o01", "o02"]);
    expect(out).toHaveLength(10);
  });

  it("não enche além do que existe e capacidade 0 devolve vazio", () => {
    expect(buildSession([c("a", 1)], 5)).toHaveLength(1);
    expect(buildSession([c("a", 1)], 0)).toEqual([]);
  });

  it("propriedades: respeita capacidade e 30%, é determinística e independe da ordem de entrada", () => {
    const arb = fc.array(
      fc.record({ id: fc.uuid(), value: fc.constantFrom(0, 0.2, 1, 2), overdue: fc.boolean() }),
      { maxLength: 80 },
    );
    fc.assert(
      fc.property(arb, fc.integer({ min: 0, max: 60 }), fc.nat(), (raw, cap, k) => {
        const items = [...new Map(raw.map((x) => [x.id, x])).values()];
        const out = buildSession(items, cap);
        expect(out.length).toBeLessThanOrEqual(cap);
        expect(out.filter((x) => x.overdue).length).toBeLessThanOrEqual(debtSlots(cap));
        const rot = k % (items.length || 1);
        expect(buildSession(items.slice(rot).concat(items.slice(0, rot)), cap)).toEqual(out);
      }),
    );
  });
});
