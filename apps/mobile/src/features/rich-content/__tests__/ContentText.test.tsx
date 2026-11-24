import { render, screen } from "@testing-library/react-native";

import { serializeContent, type ContentDoc } from "@/domain/card/content";
import "@/shared/i18n";

import { ContentText } from "../ContentText";

const doc: ContentDoc = {
  type: "doc",
  v: 1,
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Qual o " },
        { type: "text", text: "flexor", marks: [{ type: "bold" }] },
        { type: "text", text: "?" },
      ],
    },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "braquial" }] }] },
      ],
    },
  ],
};

describe("ContentText", () => {
  it("sem documento mostra o texto simples", async () => {
    await render(<ContentText doc={null} fallback="Braquial" />);
    expect(screen.getByText("Braquial")).toBeTruthy();
  });

  it("documento inválido também cai no texto simples", async () => {
    await render(<ContentText doc="lixo" fallback="Braquial" />);
    expect(screen.getByText("Braquial")).toBeTruthy();
  });

  it("mostra o texto formatado, com negrito e lista com marcador", async () => {
    await render(<ContentText doc={serializeContent(doc)} fallback="ignorado" />);
    const bold = screen.getByText("flexor");
    expect(JSON.stringify(bold.props.style)).toContain("800");
    expect(screen.getByText("braquial")).toBeTruthy();
    expect(screen.getByText("•")).toBeTruthy();
    expect(screen.queryByText("ignorado")).toBeNull();
  });
});
