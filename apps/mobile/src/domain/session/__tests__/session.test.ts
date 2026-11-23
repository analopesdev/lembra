import fc from "fast-check";

import {
  buildSession,
  daysToClearDebt,
  debtSlots,
  isOverdue,
  newCardsAllowed,
  sessionCapacity,
  sessionIds,
  type NewCandidate,
  type ReviewCandidate,
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

  it("atrasado = vencimento em dia de estudo anterior; vencer hoje (qualquer hora do dia de estudo) não é dívida", () => {
    const tz = "America/Sao_Paulo";
    expect(isOverdue(new Date("2026-03-10T05:00:00Z"), "2026-03-10", tz)).toBe(true); // 02:00 local = dia 09
    expect(isOverdue(new Date("2026-03-10T08:00:00Z"), "2026-03-10", tz)).toBe(false); // 05:00 local = dia 10
    expect(isOverdue(new Date("2026-03-11T06:59:00Z"), "2026-03-10", tz)).toBe(false); // 03:59 local de 11 = dia 10
  });
});

const rv = (prefix: string, n: number, base = 10): ReviewCandidate[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${prefix}${String(i).padStart(2, "0")}`,
    value: base - i * 0.1,
  }));
const nc = (id: string, importance: 1 | 2 | 3, day: number): NewCandidate => ({
  id,
  importance,
  createdAt: new Date(Date.UTC(2026, 0, day)),
});

describe("buildSession: três fases", () => {
  it("(a) só vencidas de hoje, por V decrescente, empate por ID", () => {
    const s = buildSession({
      dueToday: [
        { id: "b", value: 1 },
        { id: "a", value: 1 },
        { id: "c", value: 3 },
        { id: "d", value: 0.5 },
      ],
      overdue: [],
      newCards: [],
      capacity: 3,
      newCardsLeftToday: 5,
    });
    expect(sessionIds(s)).toEqual(["c", "a", "b"]);
  });

  it("(b) com revisões de hoje pendentes, atrasados ficam em 30% do tempo", () => {
    const s = buildSession({
      dueToday: rv("t", 20),
      overdue: rv("o", 20),
      newCards: [],
      capacity: 10,
      newCardsLeftToday: 5,
    });
    expect(s.overdue.map((c) => c.id)).toEqual(["o00", "o01", "o02"]); // 30% de 10 = 3, os de maior V
    expect(s.dueToday).toHaveLength(7);
  });

  it("(b) sobra de tempo depois das revisões de hoje vai para os atrasados", () => {
    const s = buildSession({
      dueToday: rv("t", 4),
      overdue: rv("o", 20),
      newCards: [],
      capacity: 10,
      newCardsLeftToday: 5,
    });
    expect(s.dueToday).toHaveLength(4);
    expect(s.overdue).toHaveLength(6); // 10 − 4, bem acima dos 30%
  });

  it("(b) sem revisões de hoje, o tempo todo vai para os atrasados", () => {
    const s = buildSession({
      dueToday: [],
      overdue: rv("o", 50),
      newCards: [],
      capacity: 10,
      newCardsLeftToday: 5,
    });
    expect(s.overdue).toHaveLength(10);
  });

  it("(b) poucos atrasados: a reserva não excede o que existe, e o resto volta às revisões de hoje", () => {
    const s = buildSession({
      dueToday: rv("t", 20),
      overdue: rv("o", 1),
      newCards: [],
      capacity: 10,
      newCardsLeftToday: 0,
    });
    expect(s.overdue).toHaveLength(1);
    expect(s.dueToday).toHaveLength(9);
  });

  it("(c) dívida > 0 bloqueia novos, mesmo com tempo sobrando", () => {
    const s = buildSession({
      dueToday: [],
      overdue: rv("o", 1),
      newCards: [nc("n1", 3, 1)],
      capacity: 10,
      newCardsLeftToday: 5,
    });
    expect(s.newCards).toEqual([]);
    expect(s.overdue).toHaveLength(1);
  });

  it("(c) dívida > 0 bloqueia novos mesmo quando os atrasados não cabem hoje", () => {
    const s = buildSession({
      dueToday: [],
      overdue: rv("o", 100),
      newCards: [nc("n1", 3, 1)],
      capacity: 10,
      newCardsLeftToday: 5,
    });
    expect(s.newCards).toEqual([]);
  });

  it("(c) dívida 0: novos por importância (3 primeiro) e depois data de criação, até o limite diário", () => {
    const s = buildSession({
      dueToday: rv("t", 2),
      overdue: [],
      newCards: [nc("a", 1, 1), nc("b", 3, 5), nc("c", 3, 2), nc("d", 2, 1), nc("e", 3, 2)],
      capacity: 20,
      newCardsLeftToday: 4,
    });
    expect(s.newCards.map((c) => c.id)).toEqual(["c", "e", "b", "d"]); // 3: c(2) e(2, desempate ID) b(5); depois 2: d
  });

  it("(c) novos só com tempo sobrando", () => {
    const s = buildSession({
      dueToday: rv("t", 9),
      overdue: [],
      newCards: [nc("a", 3, 1), nc("b", 3, 2), nc("c", 3, 3)],
      capacity: 10,
      newCardsLeftToday: 5,
    });
    expect(s.newCards.map((c) => c.id)).toEqual(["a"]);
  });

  it("(c) limite diário 0 e capacidade 0 não deixam entrar novos", () => {
    const base = { dueToday: [], overdue: [], newCards: [nc("a", 3, 1)] };
    expect(buildSession({ ...base, capacity: 10, newCardsLeftToday: 0 }).newCards).toEqual([]);
    expect(buildSession({ ...base, capacity: 0, newCardsLeftToday: 5 })).toEqual({
      dueToday: [],
      overdue: [],
      newCards: [],
    });
  });

  it("ordem de apresentação: hoje, atrasados, novos", () => {
    const s = buildSession({
      dueToday: rv("t", 1),
      overdue: [],
      newCards: [nc("n", 2, 1)],
      capacity: 5,
      newCardsLeftToday: 5,
    });
    expect(sessionIds(s)).toEqual(["t00", "n"]);
  });

  it("propriedades: capacidade, 30% com hoje pendente, novos só sem dívida, determinismo e ordem de entrada", () => {
    const rvArb = fc.array(fc.record({ id: fc.uuid(), value: fc.constantFrom(0, 0.2, 1, 2) }), {
      maxLength: 40,
    });
    const ncArb = fc.array(
      fc.record({
        id: fc.uuid(),
        importance: fc.constantFrom<1 | 2 | 3>(1, 2, 3),
        createdAt: fc.date({ min: new Date(0), max: new Date(2e12), noInvalidDate: true }),
      }),
      { maxLength: 40 },
    );
    const uniq = <T extends { id: string }>(xs: T[]) => [...new Map(xs.map((x) => [x.id, x])).values()];
    fc.assert(
      fc.property(
        rvArb,
        rvArb,
        ncArb,
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 0, max: 10 }),
        fc.nat(),
        (t0, o0, n0, capacity, left, k) => {
          const seen = new Set<string>();
          const dedupe = <T extends { id: string }>(xs: T[]) =>
            uniq(xs).filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
          const dueToday = dedupe(t0);
          const overdue = dedupe(o0);
          const newCards = dedupe(n0);
          const out = buildSession({ dueToday, overdue, newCards, capacity, newCardsLeftToday: left });
          const total = out.dueToday.length + out.overdue.length + out.newCards.length;
          expect(total).toBeLessThanOrEqual(capacity);
          if (overdue.length > 0) expect(out.newCards).toHaveLength(0);
          expect(out.newCards.length).toBeLessThanOrEqual(left);
          if (dueToday.length > out.dueToday.length)
            expect(out.overdue.length).toBeLessThanOrEqual(debtSlots(capacity));
          const rot = (xs: unknown[]) => k % (xs.length || 1);
          const rotate = <T>(xs: T[]) => xs.slice(rot(xs)).concat(xs.slice(0, rot(xs)));
          expect(
            buildSession({
              dueToday: rotate(dueToday),
              overdue: rotate(overdue),
              newCards: rotate(newCards),
              capacity,
              newCardsLeftToday: left,
            }),
          ).toEqual(out);
        },
      ),
    );
  });
});
