import { coverageOf, gradeByCoverage, intervalDaysFor, provisionalGrader } from "..";
import { defaultParams, initialState } from "../../scheduling";

describe("nota provisória", () => {
  it("resposta igual ao verso e rápida vira Fácil", () => {
    const r = provisionalGrader.grade(
      "Plano sagital, em torno do eixo coronal",
      "Plano sagital, em torno do eixo coronal",
      6,
    );
    expect(r.rating).toBe(4);
  });

  it("resposta completa em tempo médio vira Bom", () => {
    expect(
      provisionalGrader.grade("plano sagital eixo coronal", "Plano sagital, eixo coronal", 15).rating,
    ).toBe(3);
  });

  it("resposta completa porém muito lenta vira Difícil", () => {
    expect(gradeByCoverage(1, 45)).toBe(2);
  });

  it("resposta parcial vira Difícil e resposta errada vira De novo", () => {
    expect(gradeByCoverage(0.5, 5)).toBe(2);
    expect(provisionalGrader.grade("plano frontal", "Plano sagital, eixo coronal", 5).rating).toBe(1);
  });

  it("ignora acentos, caixa e pontuação", () => {
    expect(coverageOf("LÁTERO-LATERAL!", "látero lateral")).toBe(1);
  });

  it("resposta vazia tem cobertura zero", () => {
    expect(coverageOf("", "algo")).toBe(0);
    expect(coverageOf("algo", "")).toBe(0);
  });
});

describe("prévia do intervalo", () => {
  const at = new Date("2026-11-22T12:00:00Z");
  const base = initialState(at);

  it("nota melhor nunca agenda mais cedo", () => {
    const params = defaultParams();
    const days = ([1, 2, 3, 4] as const).map((r) => intervalDaysFor(base, r, at, params));
    expect(days).toEqual([...days].sort((a, b) => a - b));
    expect(days[0]).toBeGreaterThanOrEqual(1);
  });
});
