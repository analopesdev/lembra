import { readFileSync } from "node:fs";
import { join } from "node:path";

import { addDays, diffDays, isoWeekday, studyDayOf } from "../study-day";

interface Vectors {
  studyDays: { at: string; zone: string; studyDay: string }[];
  calendar: { from: string; to: string; diff: number; weekdayFrom: number; weekdayTo: number }[];
}

const file = join(__dirname, "../../../../../../contracts/study-day-vectors/vectors.v1.json");
const vectors = JSON.parse(readFileSync(file, "utf8")) as Vectors;

describe("vetores de dia de estudo compartilhados com o Go (RN-13)", () => {
  it("dia de estudo de cada instante e fuso", () => {
    const wrong = vectors.studyDays.filter((v) => studyDayOf(new Date(v.at), v.zone) !== v.studyDay);
    expect(wrong).toEqual([]);
    expect(vectors.studyDays.length).toBeGreaterThan(3000);
  });

  it("aritmética de calendário e dia da semana", () => {
    const wrong = vectors.calendar.filter(
      (v) =>
        diffDays(v.from, v.to) !== v.diff ||
        addDays(v.from, v.diff) !== v.to ||
        isoWeekday(v.from) !== v.weekdayFrom ||
        isoWeekday(v.to) !== v.weekdayTo,
    );
    expect(wrong).toEqual([]);
  });
});
