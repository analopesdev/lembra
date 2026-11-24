import {
  clozeDocFromSyntax,
  clozeIds,
  clozeSyntaxFromDoc,
  fromEditorJson,
  hasFormatting,
  toEditorJson,
  fromPlainText,
  isEmptyContent,
  mediaIds,
  parseContent,
  serializeContent,
  toPlainText,
  type ContentDoc,
} from "../content";

const rich: ContentDoc = {
  type: "doc",
  v: 1,
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Qual músculo é o principal " },
        { type: "text", text: "flexor do cotovelo", marks: [{ type: "bold" }] },
        { type: "text", text: "?" },
      ],
    },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "item um" }] }] },
      ],
    },
    { type: "paragraph", content: [{ type: "math", attrs: { latex: "E=mc^2" } }] },
    { type: "image", attrs: { mediaId: "m-1" } },
    { type: "audio", attrs: { mediaId: "m-2", autoplay: true } },
  ],
};

describe("conteúdo rico (ADR-0017)", () => {
  it("texto puro ida e volta: fromPlainText e toPlainText são inversos, inclusive com várias linhas", () => {
    for (const s of ["Braquial", "linha 1\nlinha 2", "a\n\nb", "Ação & <tag> “aspas”"]) {
      expect(toPlainText(fromPlainText(s))).toBe(s);
    }
  });

  it("toPlainText ignora marcas e mídias e mantém lista e fórmula", () => {
    expect(toPlainText(rich)).toBe("Qual músculo é o principal flexor do cotovelo?\nitem um\nE=mc^2");
  });

  it("serializa e lê de volta o mesmo documento", () => {
    const back = parseContent(serializeContent(rich));
    expect(back).toEqual({ ok: true, doc: rich });
  });

  it.each([
    ["nulo", null],
    ["não é JSON", "oi"],
    ["versão desconhecida", JSON.stringify({ ...rich, v: 2 })],
    ["nó desconhecido", JSON.stringify({ type: "doc", v: 1, content: [{ type: "tabela" }] })],
    ["mídia sem mediaId", JSON.stringify({ type: "doc", v: 1, content: [{ type: "image", attrs: {} }] })],
  ])("recusa %s", (_n, raw) => expect(parseContent(raw)).toEqual({ ok: false }));

  it("mídias são referenciadas por mediaId, na ordem do documento", () => {
    expect(mediaIds(rich)).toEqual(["m-1", "m-2"]);
  });

  it("vazio: só espaço não conta, mídia sozinha conta como conteúdo", () => {
    expect(isEmptyContent(fromPlainText("   "))).toBe(true);
    expect(isEmptyContent(fromPlainText(""))).toBe(true);
    expect(isEmptyContent({ type: "doc", v: 1, content: [{ type: "image", attrs: { mediaId: "m" } }] })).toBe(
      false,
    );
    expect(isEmptyContent(rich)).toBe(false);
  });

  it("lacunas: ids únicos e ordenados, inclusive dentro de listas", () => {
    const doc: ContentDoc = {
      type: "doc",
      v: 1,
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "O " },
            { type: "cloze", attrs: { id: 2 }, content: [{ type: "text", text: "úmero" }] },
            { type: "cloze", attrs: { id: 1 }, content: [{ type: "text", text: "ulna" }] },
            { type: "cloze", attrs: { id: 2 }, content: [{ type: "text", text: "de novo" }] },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "cloze", attrs: { id: 3 }, content: [{ type: "text", text: "x" }] }],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(clozeIds(doc)).toEqual([1, 2, 3]);
    expect(toPlainText(doc)).toBe("O úmeroulnade novo\nx");
  });
});

describe("sintaxe de lacuna {{ }}", () => {
  it("converte para lacunas numeradas e volta para a mesma sintaxe", () => {
    const text = "O nervo {{musculocutâneo}} inerva o {{bíceps}}.\nOutra linha {{x}}";
    const doc = clozeDocFromSyntax(text);
    expect(doc && clozeIds(doc)).toEqual([1, 2, 3]);
    expect(doc && clozeSyntaxFromDoc(doc)).toBe(text);
  });

  it("sem lacuna devolve nulo; chaves vazias ou soltas não contam", () => {
    expect(clozeDocFromSyntax("texto comum")).toBeNull();
    expect(clozeDocFromSyntax("vazio {{}} e {{ solto")).toBeNull();
  });
});

describe("ponte com o editor (TipTap)", () => {
  const editorJson = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        attrs: { textAlign: null },
        content: [
          { type: "text", text: "Qual o " },
          { type: "text", text: "flexor", marks: [{ type: "bold" }, { type: "link", attrs: { href: "x" } }] },
          {
            type: "text",
            text: " ?",
            marks: [{ type: "textStyle", attrs: { color: "#c00" } }, { type: "strike" }],
          },
        ],
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              { type: "paragraph", content: [{ type: "text", text: "a", marks: [{ type: "italic" }] }] },
            ],
          },
        ],
      },
      { type: "horizontalRule" },
    ],
  };

  it("mantém negrito, itálico, cor e lista; descarta marcas e nós que não suportamos", () => {
    const doc = fromEditorJson(editorJson);
    expect(doc).toEqual({
      type: "doc",
      v: 1,
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Qual o " },
            { type: "text", text: "flexor", marks: [{ type: "bold" }] },
            { type: "text", text: " ?", marks: [{ type: "color", attrs: { color: "#c00" } }] },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "a", marks: [{ type: "italic" }] }] },
              ],
            },
          ],
        },
      ],
    });
  });

  it("ida e volta: toEditorJson e fromEditorJson devolvem o mesmo documento", () => {
    const doc = fromEditorJson(editorJson);
    expect(doc && fromEditorJson(toEditorJson(doc))).toEqual(doc);
  });

  it("entrada inválida ou vazia vira nulo ou parágrafo vazio", () => {
    expect(fromEditorJson(null)).toBeNull();
    expect(fromEditorJson({ type: "texto" })).toBeNull();
    expect(fromEditorJson({ type: "doc", content: [] })).toEqual({
      type: "doc",
      v: 1,
      content: [{ type: "paragraph" }],
    });
  });

  it("hasFormatting: só texto puro não conta; marca ou lista contam", () => {
    expect(hasFormatting(fromPlainText("oi\nlinha 2"))).toBe(false);
    expect(hasFormatting(fromEditorJson(editorJson)!)).toBe(true);
    expect(
      hasFormatting({
        type: "doc",
        v: 1,
        content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "bold" }] }] }],
      }),
    ).toBe(true);
  });
});
