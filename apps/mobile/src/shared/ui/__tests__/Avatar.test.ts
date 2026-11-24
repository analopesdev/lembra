import { avatarSvg } from "../Avatar";

describe("avatarSvg (estilo Waves)", () => {
  it("gera um SVG", () => {
    expect(avatarSvg("ana")).toMatch(/^<svg[\s\S]*<\/svg>$/);
  });

  it("é determinístico: mesma semente, mesmo desenho; semente diferente, desenho diferente", () => {
    expect(avatarSvg("ana")).toBe(avatarSvg("ana"));
    expect(avatarSvg("ana")).not.toBe(avatarSvg("bia"));
  });

  it("semente vazia usa a semente padrão", () => {
    expect(avatarSvg("")).toBe(avatarSvg("lembra"));
  });
});
