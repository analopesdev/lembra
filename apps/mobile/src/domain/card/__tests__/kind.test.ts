import type { Card } from "../../types";
import { serializeContent, type ContentDoc } from "../content";
import { CLOZE_PLACEHOLDER, clozeView, isReversedPair, reversedCompanion, syncCompanion } from "../kind";

const T = new Date("2026-03-10T10:00:00Z");
const main: Card = {
  id: "a",
  collectionId: "col-1",
  front: "Braquial",
  back: "Principal flexor",
  frontDoc: null,
  backDoc: null,
  kind: "reversed",
  direction: "forward",
  pairId: null,
  tags: ["x"],
  importance: 2,
  status: "active",
  createdAt: T,
  updatedAt: T,
  deletedAt: null,
};

describe("card invertido (RF-51, RN-11)", () => {
  it("o companheiro troca frente e verso, aponta para o principal e é outro card", () => {
    const c = reversedCompanion(main, "b");
    expect(c).toMatchObject({
      id: "b",
      front: "Principal flexor",
      back: "Braquial",
      direction: "reverse",
      pairId: "a",
      kind: "reversed",
    });
    expect(isReversedPair(main, c)).toBe(true);
    expect(isReversedPair(main, { ...c, pairId: "z" })).toBe(false);
  });

  it("troca também o conteúdo rico (por exemplo, áudio na frente vira o verso)", () => {
    const withDoc = { ...main, frontDoc: "F", backDoc: "B" };
    const c = reversedCompanion(withDoc, "b");
    expect([c.frontDoc, c.backDoc]).toEqual(["B", "F"]);
  });

  it("sincronizar acompanha edição, coleção, importância, tags, status e exclusão do principal", () => {
    const c = reversedCompanion(main, "b");
    const later = new Date("2026-03-11T10:00:00Z");
    const edited: Card = {
      ...main,
      front: "Bíceps",
      back: "Flexor do ombro",
      collectionId: "col-2",
      importance: 3,
      tags: ["y"],
      status: "suspended",
      updatedAt: later,
      deletedAt: later,
    };
    expect(syncCompanion(edited, c)).toMatchObject({
      id: "b",
      pairId: "a",
      front: "Flexor do ombro",
      back: "Bíceps",
      collectionId: "col-2",
      importance: 3,
      tags: ["y"],
      status: "suspended",
      updatedAt: later,
      deletedAt: later,
      createdAt: T,
    });
  });
});

describe("lacuna (RF-51)", () => {
  const doc: ContentDoc = {
    type: "doc",
    v: 1,
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "O nervo " },
          { type: "cloze", attrs: { id: 1 }, content: [{ type: "text", text: "musculocutâneo" }] },
          { type: "text", text: " inerva o " },
          { type: "cloze", attrs: { id: 2 }, content: [{ type: "text", text: "bíceps" }] },
          { type: "text", text: "." },
        ],
      },
    ],
  };

  it("frente esconde as lacunas e o verso mostra as respostas", () => {
    expect(clozeView(serializeContent(doc))).toEqual({
      count: 2,
      front: `O nervo ${CLOZE_PLACEHOLDER} inerva o ${CLOZE_PLACEHOLDER}.`,
      back: "O nervo musculocutâneo inerva o bíceps.",
    });
  });

  it("sem lacuna ou conteúdo inválido não vira card de lacuna", () => {
    expect(clozeView(null)).toBeNull();
    expect(clozeView("oi")).toBeNull();
    expect(clozeView(serializeContent({ type: "doc", v: 1, content: [{ type: "paragraph" }] }))).toBeNull();
  });
});
