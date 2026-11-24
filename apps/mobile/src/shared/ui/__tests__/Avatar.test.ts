import { avatarSvg } from "../Avatar";

const AVATAR_STYLES = ["thumbs", "lorelei", "notionists", "open-peeps", "shapes"] as const;

describe("avatarSvg", () => {
  it.each(AVATAR_STYLES)("%s gera um SVG", (style) => {
    expect(avatarSvg(style, "ana")).toMatch(/^<svg[\s\S]*<\/svg>$/);
  });

  it("é determinístico: mesma semente, mesmo desenho; semente diferente, desenho diferente", () => {
    expect(avatarSvg("lorelei", "ana")).toBe(avatarSvg("lorelei", "ana"));
    expect(avatarSvg("lorelei", "ana")).not.toBe(avatarSvg("lorelei", "bia"));
  });

  it("semente vazia e estilo desconhecido usam padrões estáveis", () => {
    expect(avatarSvg("thumbs", "")).toBe(avatarSvg("thumbs", "lembra"));
    expect(avatarSvg("inexistente", "x")).toBe(avatarSvg("thumbs", "x"));
  });
});
