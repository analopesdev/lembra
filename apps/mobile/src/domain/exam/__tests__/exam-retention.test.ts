import { daysUntilExam, examRetention, prioritizeImportance3 } from "../exam-retention";

describe("examRetention (RN-05)", () => {
  it.each([
    [null, 0.9],
    [365, 0.85],
    [31, 0.85],
    [30, 0.9],
    [8, 0.9],
    [7, 0.95],
    [1, 0.95],
    [0, 0.95],
    [-1, 0.9],
    [-100, 0.9],
  ])("faltam %s dias → %s", (d, want) => expect(examRetention(d)).toBe(want));

  it("critério de aceite: prova em 7 dias usa 95%", () => {
    expect(examRetention(daysUntilExam("2026-03-10", "2026-03-17"))).toBe(0.95);
  });

  it("importância 3 primeiro só nos últimos 7 dias", () => {
    expect([null, 8, 7, 0, -1].map(prioritizeImportance3)).toEqual([false, false, true, true, false]);
  });

  it("daysUntilExam", () => {
    expect(daysUntilExam("2026-03-10", null)).toBeNull();
    expect(daysUntilExam("2026-03-10", "2026-03-09")).toBe(-1);
  });
});
