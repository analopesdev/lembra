import { validateCardDraft } from "../card";

describe("validateCardDraft (RF-20)", () => {
  it("aceita card completo e aplica trim", () => {
    expect(validateCardDraft({ front: "  P?  ", back: " R ", collectionId: "c1", importance: 3 })).toEqual({
      ok: true,
      front: "P?",
      back: "R",
      frontDoc: null,
      collectionId: "c1",
      importance: 3,
      kind: "basic",
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

describe("validateCardDraft por tipo (RF-51)", () => {
  it("invertido e digitar validam como o básico e guardam o tipo", () => {
    for (const kind of ["reversed", "type"] as const) {
      expect(
        validateCardDraft({ front: "P", back: "R", collectionId: "c1", importance: 2, kind }),
      ).toMatchObject({
        ok: true,
        kind,
        front: "P",
        back: "R",
        frontDoc: null,
      });
      expect(validateCardDraft({ front: "P", back: "", collectionId: "c1", importance: 2, kind })).toEqual({
        ok: false,
        errors: ["back_empty"],
      });
    }
  });

  it("lacuna: frente com {{ }} gera o documento, esconde na frente e revela no verso; verso é opcional", () => {
    const r = validateCardDraft({
      front: "O nervo {{musculocutâneo}} inerva o bíceps.",
      back: "",
      collectionId: "c1",
      importance: 2,
      kind: "cloze",
    });
    expect(r).toMatchObject({
      ok: true,
      kind: "cloze",
      front: "O nervo [...] inerva o bíceps.",
      back: "O nervo musculocutâneo inerva o bíceps.",
    });
    expect(r.ok && r.frontDoc).toContain('"type":"cloze"');
  });

  it("lacuna sem {{ }} pede para marcar a lacuna", () => {
    expect(
      validateCardDraft({ front: "sem marca", back: "", collectionId: "c1", importance: 2, kind: "cloze" }),
    ).toEqual({ ok: false, errors: ["cloze_missing"] });
  });
});
