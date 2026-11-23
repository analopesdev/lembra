import { isValidDay } from "../valid-day";

const day = (planned: number, plannedDone: number, answered: number, activeSeconds: number) => ({
  planned,
  plannedDone,
  answered,
  activeSeconds,
});

describe("isValidDay (RN-04)", () => {
  it.each([
    ["80% exatos do planejado", day(10, 8, 8, 60), true],
    ["79% não basta", day(100, 79, 79, 60), false],
    ["4 de 5 = 80%", day(5, 4, 4, 30), true],
    ["abrir o app e virar 2 cards fáceis (critério de aceite)", day(20, 2, 2, 20), false],
    ["3 min com 10 respostas (critério de aceite)", day(20, 2, 10, 180), true],
    ["3 min com 9 respostas", day(20, 2, 9, 180), false],
    ["179 s com 10 respostas", day(20, 2, 10, 179), false],
    ["nada planejado e sem esforço", day(0, 0, 0, 0), false],
    ["nada planejado mas 3 min e 10 respostas", day(0, 0, 10, 200), true],
    ["planejado cumprido supera pouco tempo", day(3, 3, 3, 30), true],
  ])("%s", (_n, a, want) => expect(isValidDay(a)).toBe(want));
});
