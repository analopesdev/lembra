import { formatExamDate, maskExamDate, parseExamDate, validateName } from "../collection";

const TODAY = "2026-03-10";

describe("validateName", () => {
  it.each([
    ["Anatomia I", { ok: true, name: "Anatomia I" }],
    ["  Anatomia   I  ", { ok: true, name: "Anatomia I" }],
    ["", { ok: false, error: "empty" }],
    ["   ", { ok: false, error: "empty" }],
    ["a".repeat(60), { ok: true, name: "a".repeat(60) }],
    ["a".repeat(61), { ok: false, error: "too_long" }],
  ])("%j", (raw, want) => expect(validateName(raw)).toEqual(want));
});

describe("parseExamDate", () => {
  it.each([
    ["", { ok: true, day: null }],
    ["04/12/2026", { ok: true, day: "2026-12-04" }],
    ["4/2/2027", { ok: true, day: "2027-02-04" }],
    ["10/03/2026", { ok: true, day: "2026-03-10" }],
    ["09/03/2026", { ok: false, error: "past" }],
    ["31/02/2027", { ok: false, error: "invalid" }],
    ["29/02/2028", { ok: true, day: "2028-02-29" }],
    ["29/02/2027", { ok: false, error: "invalid" }],
    ["2026-12-04", { ok: false, error: "invalid" }],
    ["32/01/2027", { ok: false, error: "invalid" }],
    ["10/13/2027", { ok: false, error: "invalid" }],
    ["abc", { ok: false, error: "invalid" }],
  ])("%j", (raw, want) => expect(parseExamDate(raw, TODAY)).toEqual(want));
});

describe("máscara e formatação", () => {
  it.each([
    ["0", "0"],
    ["041", "04/1"],
    ["04122026", "04/12/2026"],
    ["04/12/20269999", "04/12/2026"],
    ["a1b2c3", "12/3"],
  ])("mask %s → %s", (raw, want) => expect(maskExamDate(raw)).toBe(want));

  it("format é o inverso do parse", () => {
    expect(formatExamDate("2026-12-04")).toBe("04/12/2026");
  });
});
