import { dayStatus, type DayStatus } from "../valid-day";

const day = (planned: number, plannedDone: number, answered: number, activeSeconds: number) => ({
  planned,
  plannedDone,
  answered,
  activeSeconds,
});

describe("dayStatus (RN-04)", () => {
  it.each<[string, ReturnType<typeof day>, DayStatus]>([
    ["80% exatos do planejado", day(10, 8, 8, 60), "valid"],
    ["79% não basta", day(100, 79, 79, 60), "invalid"],
    ["4 de 5 = 80%", day(5, 4, 4, 30), "valid"],
    ["abrir o app e virar 2 cards fáceis (critério de aceite)", day(20, 2, 2, 20), "invalid"],
    ["3 min com 10 respostas (critério de aceite)", day(20, 2, 10, 180), "valid"],
    ["3 min com 9 respostas", day(20, 2, 9, 180), "invalid"],
    ["179 s com 10 respostas", day(20, 2, 10, 179), "invalid"],
    ["planejado cumprido supera pouco tempo", day(3, 3, 3, 30), "valid"],
    // Plano vazio: dia neutro (não quebra, não gasta congelamento, não incrementa).
    ["plano vazio sem estudo", day(0, 0, 0, 0), "neutral"],
    ["plano vazio com poucas respostas", day(0, 0, 4, 60), "neutral"],
    ["plano vazio com 3 min e 10 respostas", day(0, 0, 10, 200), "valid"],
    ["plano vazio com 3 min mas 9 respostas", day(0, 0, 9, 200), "neutral"],
  ])("%s", (_n, a, want) => expect(dayStatus(a)).toBe(want));
});
