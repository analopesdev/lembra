import { contrastOf, isHexColor } from "../color";

describe("contrastOf", () => {
  it.each([
    ["#ffffff", "dark"],
    ["#9edfdc", "dark"],
    ["#fac1bc", "dark"],
    ["#000000", "light"],
    ["#1a237e", "light"],
    ["9edfdc", "dark"],
    ["invalido", "dark"],
  ] as const)("%s pede ícone %s", (hex, want) => expect(contrastOf(hex)).toBe(want));
});

describe("isHexColor", () => {
  it.each([
    ["#9edfdc", true],
    ["#ABCDEF", true],
    ["tint", false],
    ["#fff", false],
    ["", false],
  ] as const)("%s", (v, want) => expect(isHexColor(v)).toBe(want));
});
