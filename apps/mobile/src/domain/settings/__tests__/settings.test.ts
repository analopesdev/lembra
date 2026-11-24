import {
  defaultSettings,
  normalizeMinutes,
  normalizeNewCards,
  normalizeTheme,
  normalizeWeekdays,
} from "../settings";

describe("settings", () => {
  it("padrão: 10 min, sem folga e sem meta", () => {
    const now = new Date("2026-03-10T10:00:00Z");
    expect(defaultSettings(now)).toEqual({
      dailyMinutes: 10,
      newCardsPerDay: 5,
      theme: "auto",
      avatarSeed: "",
      glassNav: false,
      offWeekdays: [],
      goalText: "",
      updatedAt: now,
    });
  });

  it.each([
    [5, 5],
    [20, 20],
    [7, 10],
    [0, 10],
    [-5, 10],
    [Number.NaN, 10],
  ])("normalizeMinutes(%s) = %s", (v, want) => expect(normalizeMinutes(v)).toBe(want));

  it("normalizeWeekdays ordena, remove repetidos e valores fora de 1 a 7", () => {
    expect(normalizeWeekdays([7, 2, 2, 0, 8, 1.5, 3])).toEqual([2, 3, 7]);
    expect(normalizeWeekdays([])).toEqual([]);
  });

  it.each([
    [15, 15],
    [0, 1],
    [-3, 1],
    [999, 50],
    [7.6, 8],
    [Number.NaN, 5],
  ])("normalizeNewCards(%s) = %s", (v, want) => expect(normalizeNewCards(v)).toBe(want));

  it.each([
    ["light", "light"],
    ["dark", "dark"],
    ["auto", "auto"],
    ["qualquer", "auto"],
  ])("normalizeTheme(%s) = %s", (v, want) => expect(normalizeTheme(v)).toBe(want));
});
