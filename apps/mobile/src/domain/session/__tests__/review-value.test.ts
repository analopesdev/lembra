import fc from "fast-check";

import { examWeight, orderByValue, reviewValue } from "../review-value";

describe("examWeight (RN-01)", () => {
  it.each([
    [null, 1],
    [31, 1],
    [30, 1],
    [15, 1.5],
    [0, 2],
    [-1, 1],
  ])("d=%s → P=%s", (d, p) => expect(examWeight(d)).toBeCloseTo(p, 10));
});

describe("reviewValue (RN-01)", () => {
  it.each([
    [0.9, 1, null, 0.1],
    [0.9, 2, null, 0.15],
    [0.9, 3, null, 0.2],
    [0.5, 3, null, 1],
    [0.5, 3, 0, 2], // P = 2
    [1, 3, 0, 0],
    [0, 1, null, 1],
  ])("R=%s I=%s d=%s → V=%s", (r, i, d, v) => expect(reviewValue(r, i as 1 | 2 | 3, d)).toBeCloseTo(v, 10));

  it("limita R fora de [0,1]", () => {
    expect(reviewValue(-1, 1, null)).toBe(1);
    expect(reviewValue(2, 1, null)).toBe(0);
  });
});

describe("orderByValue: propriedades (ordem estável)", () => {
  const itemsArb = fc.array(fc.record({ id: fc.uuid(), value: fc.constantFrom(0, 0.1, 0.5, 1, 2) }), {
    maxLength: 60,
  });

  it("é decrescente em V e empates seguem o ID", () => {
    fc.assert(
      fc.property(itemsArb, (items) => {
        const out = orderByValue(items);
        for (let i = 1; i < out.length; i++) {
          const a = out[i - 1]!;
          const b = out[i]!;
          expect(a.value > b.value || (a.value === b.value && a.id <= b.id)).toBe(true);
        }
      }),
    );
  });

  it("não depende da ordem de entrada", () => {
    fc.assert(
      fc.property(itemsArb, fc.nat(), (items, k) => {
        const unique = [...new Map(items.map((x) => [x.id, x])).values()];
        const rotated = unique
          .slice(k % (unique.length || 1))
          .concat(unique.slice(0, k % (unique.length || 1)));
        expect(orderByValue(rotated)).toEqual(orderByValue(unique));
      }),
    );
  });
});
