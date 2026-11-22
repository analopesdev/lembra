import { renderRouter, screen } from "expo-router/testing-library";

import "@/shared/i18n";
import TabsLayout from "../app/(tabs)/_layout";
import Colecoes from "../app/(tabs)/colecoes";
import Today from "../app/(tabs)/index";
import Progresso from "../app/(tabs)/progresso";
import Quizzes from "../app/(tabs)/quizzes";

describe("navegação por abas", () => {
  it("mostra as 4 abas e abre Hoje por padrão", async () => {
    await renderRouter({
      "(tabs)/_layout": TabsLayout,
      "(tabs)/index": Today,
      "(tabs)/quizzes": Quizzes,
      "(tabs)/colecoes": Colecoes,
      "(tabs)/progresso": Progresso,
    });
    expect(await screen.findByRole("header", { name: "Hoje" })).toBeTruthy();
    for (const name of ["Hoje", "Quizzes", "Coleções", "Progresso"]) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
  });
});
