import { diffDays, isoWeekday, studyDayOf } from "../study-day";

const SP = "America/Sao_Paulo"; // UTC−3, sem horário de verão desde 2019

describe("studyDayOf (RN-13)", () => {
  it.each([
    ["1h da manhã conta para o dia anterior", "2026-03-11T04:00:00Z", SP, "2026-03-10"], // 01:00 local
    ["03:59 local ainda é o dia anterior", "2026-03-11T06:59:00Z", SP, "2026-03-10"],
    ["04:00 local já é o dia novo", "2026-03-11T07:00:00Z", SP, "2026-03-11"],
    ["meia-noite local é o dia anterior", "2026-03-11T03:00:00Z", SP, "2026-03-10"],
    ["23:59 local é o próprio dia", "2026-03-11T02:59:00Z", SP, "2026-03-10"],
    ["UTC puro", "2026-03-11T03:59:00Z", "UTC", "2026-03-10"],
    ["Tóquio (UTC+9): 03:00 local é o dia anterior", "2026-03-10T18:00:00Z", "Asia/Tokyo", "2026-03-10"],
    ["Tóquio: 04:00 local é o dia novo", "2026-03-10T19:00:00Z", "Asia/Tokyo", "2026-03-11"],
    ["virada de ano", "2026-01-01T06:00:00Z", SP, "2025-12-31"],
    ["ano bissexto", "2028-03-01T06:59:00Z", SP, "2028-02-29"],
  ])("%s", (_n, iso, tz, want) => {
    expect(studyDayOf(new Date(iso), tz)).toBe(want);
  });

  it("muda de fuso: o mesmo instante cai em dias diferentes", () => {
    const at = new Date("2026-03-11T05:00:00Z");
    expect(studyDayOf(at, SP)).toBe("2026-03-10");
    expect(studyDayOf(at, "Asia/Tokyo")).toBe("2026-03-11");
  });

  it("horário de verão (Nova York): a virada continua às 4h locais", () => {
    // 2026-03-08 02:00 NY pula para 03:00 (EST→EDT). 08:30Z = 04:30 EDT.
    expect(studyDayOf(new Date("2026-03-08T07:30:00Z"), "America/New_York")).toBe("2026-03-07"); // 03:30 EDT
    expect(studyDayOf(new Date("2026-03-08T08:30:00Z"), "America/New_York")).toBe("2026-03-08"); // 04:30 EDT
  });
});

describe("diffDays / isoWeekday", () => {
  it.each([
    ["2026-03-10", "2026-03-10", 0],
    ["2026-03-10", "2026-04-09", 30],
    ["2026-03-10", "2026-03-03", -7],
    ["2026-02-27", "2026-03-01", 2],
    ["2028-02-28", "2028-03-01", 2],
  ])("diff %s → %s = %d", (a, b, n) => expect(diffDays(a, b)).toBe(n));

  it.each([
    ["2026-03-09", 1],
    ["2026-03-15", 7],
    ["2026-11-22", 7],
  ])("isoWeekday %s = %d", (d, n) => expect(isoWeekday(d)).toBe(n));
});

import fc from "fast-check";

import { addDays } from "../study-day";

describe("addDays e consistência do calendário", () => {
  it("addDays cruza mês, ano e bissexto", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("propriedade: diffDays(a, addDays(a, n)) == n e o dia da semana avança n mod 7", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -40000, max: 40000 }),
        fc.integer({ min: -4000, max: 4000 }),
        (base, n) => {
          const a = addDays("2026-03-10", base);
          const b = addDays(a, n);
          expect(diffDays(a, b)).toBe(n);
          expect((((isoWeekday(b) - isoWeekday(a) - n) % 7) + 7) % 7).toBe(0);
        },
      ),
    );
  });
});
