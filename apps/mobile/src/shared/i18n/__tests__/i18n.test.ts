import i18n from "../index";

describe("i18n", () => {
  it("usa pt-BR e traduz os nomes das 4 abas", () => {
    expect(i18n.language).toBe("pt-BR");
    expect(["today", "quizzes", "collections", "progress"].map((k) => i18n.t(`tabs.${k}`))).toEqual([
      "Hoje",
      "Quizzes",
      "Coleções",
      "Progresso",
    ]);
  });
});
