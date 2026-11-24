import { MAX_MESSAGE_LENGTH, validateFeedback } from "../feedback";

const base = { type: "suggestion" as const, includeDeviceInfo: true };

describe("validateFeedback", () => {
  it("aceita e aplica trim", () => {
    expect(validateFeedback({ ...base, message: "  Oi  " })).toEqual({
      ok: true,
      input: { ...base, message: "Oi" },
    });
  });

  it.each([
    ["", "empty"],
    ["   \n ", "empty"],
    ["a".repeat(MAX_MESSAGE_LENGTH + 1), "too_long"],
  ] as const)("recusa %j", (message, error) => {
    expect(validateFeedback({ ...base, message })).toEqual({ ok: false, error });
  });

  it("aceita exatamente o limite", () => {
    expect(validateFeedback({ ...base, message: "a".repeat(MAX_MESSAGE_LENGTH) }).ok).toBe(true);
  });

  it("preserva o tipo e a escolha dos dados do aparelho", () => {
    const r = validateFeedback({ type: "complaint", message: "x", includeDeviceInfo: false });
    expect(r).toEqual({ ok: true, input: { type: "complaint", message: "x", includeDeviceInfo: false } });
  });
});
