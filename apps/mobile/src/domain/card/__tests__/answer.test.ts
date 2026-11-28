import { checkTypedAnswer, normalizeAnswer } from "../answer";

const base = { expected: "Músculo braquial", elapsedMs: 8_000, scheduledDays: 3 };

describe("normalizeAnswer (ADR-0014)", () => {
  it("ignora maiúsculas, acentos, espaços e pontuação final", () => {
    expect(normalizeAnswer("  MÚSCULO   Braquial. ")).toBe("musculo braquial");
    expect(normalizeAnswer("1º de março!")).toBe("1º de marco");
  });
});

describe("checkTypedAnswer (RN-03)", () => {
  it("vazio ou 'não sei' vira Errei", () => {
    expect(checkTypedAnswer({ ...base, typed: "" })).toEqual({ result: "blank", suggested: 1 });
    expect(checkTypedAnswer({ ...base, typed: "Não sei" })).toEqual({ result: "blank", suggested: 1 });
  });

  it("igual ao gabarito vira Bom", () => {
    expect(checkTypedAnswer({ ...base, typed: "musculo braquial" })).toEqual({
      result: "exact",
      suggested: 3,
    });
  });

  it("igual, mas com mais de 20 s, vira Difícil", () => {
    expect(checkTypedAnswer({ ...base, typed: "Músculo braquial", elapsedMs: 21_000 }).suggested).toBe(2);
  });

  it("igual, em menos de 5 s e card estável, vira Fácil", () => {
    const fast = { ...base, typed: "Músculo braquial", elapsedMs: 3_000 };
    expect(checkTypedAnswer({ ...fast, scheduledDays: 30 }).suggested).toBe(4);
    expect(checkTypedAnswer({ ...fast, scheduledDays: 21 }).suggested).toBe(3);
  });

  it("diferente do gabarito não sugere nota", () => {
    expect(checkTypedAnswer({ ...base, typed: "bíceps" })).toEqual({ result: "different", suggested: null });
  });
});
