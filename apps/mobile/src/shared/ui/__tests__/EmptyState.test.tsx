import { render, screen } from "@testing-library/react-native";

import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("mostra título e descrição", async () => {
    await render(<EmptyState title="Hoje" description="Sem conteúdo" />);
    expect(screen.getByRole("header", { name: "Hoje" })).toBeTruthy();
    expect(screen.getByText("Sem conteúdo")).toBeTruthy();
  });
});
