import { cardRowKind, dueLabel } from "../cardRow";

describe("cardRowKind", () => {
  it.each([
    [-3, "due"],
    [0, "due"],
    [1, "learning"],
    [20, "learning"],
    [21, "mastered"],
    [90, "mastered"],
  ] as const)("%i dias até vencer é %s", (days, want) => expect(cardRowKind(days)).toBe(want));
});

describe("dueLabel", () => {
  it("vencido ou de hoje mostra o texto de hoje; senão, dias com d", () => {
    expect(dueLabel(0, "hoje")).toBe("hoje");
    expect(dueLabel(-2, "hoje")).toBe("hoje");
    expect(dueLabel(23, "hoje")).toBe("23d");
  });
});
