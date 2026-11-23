import { validateCardDraft } from "../card";

describe("validateCardDraft (RF-20)", () => {
  it("aceita card completo e aplica trim", () => {
    expect(validateCardDraft({ front: "  P?  ", back: " R ", collectionId: "c1", importance: 3 })).toEqual({
      ok: true,
      front: "P?",
      back: "R",
      collectionId: "c1",
      importance: 3,
    });
  });

  it.each([
    [{ front: "", back: "R", collectionId: "c1" }, ["front_empty"]],
    [{ front: "P", back: "   ", collectionId: "c1" }, ["back_empty"]],
    [{ front: "P", back: "R", collectionId: null }, ["collection_missing"]],
    [{ front: "", back: "", collectionId: null }, ["front_empty", "back_empty", "collection_missing"]],
  ] as const)("recusa %j", (partial, errors) => {
    expect(validateCardDraft({ importance: 2, ...partial })).toEqual({ ok: false, errors });
  });
});
