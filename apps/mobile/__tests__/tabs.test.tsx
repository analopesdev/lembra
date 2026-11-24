import { fireEvent, renderRouter, screen } from "expo-router/testing-library";

import "@/shared/i18n";
import { Text } from "react-native";

import TabsLayout from "../app/(tabs)/_layout";
import Colecoes from "../app/(tabs)/colecoes";
import Today from "../app/(tabs)/index";
import Progresso from "../app/(tabs)/progresso";
import Quizzes from "../app/(tabs)/quizzes";

jest.mock("@/data/container", () => {
  const { InMemoryCardsRepository } = jest.requireActual("@/data/repositories/cards.memory");
  const { InMemoryCollectionsRepository } = jest.requireActual("@/data/repositories/collections.memory");
  const { InMemorySettingsRepository } = jest.requireActual("@/data/repositories/settings.memory");
  const { defaultSettings } = jest.requireActual("@/domain/settings/settings");
  const { defaultParams } = jest.requireActual("@/domain/scheduling");
  const now = () => new Date("2026-03-10T10:00:00Z");
  let state: unknown;
  const build = (firstRun: boolean) => {
    const deps = { clock: now, newId: () => Math.random().toString(36), fsrs: defaultParams() };
    const settings = new InMemorySettingsRepository(deps);
    if (!firstRun) void settings.save(defaultSettings(now()));
    state = {
      cards: new InMemoryCardsRepository(deps),
      collections: new InMemoryCollectionsRepository(deps),
      settings,
      now,
    };
  };
  build(false);
  return { getContainer: () => Promise.resolve(state), __reset: build };
});

const resetContainer = (firstRun: boolean) => jest.requireMock("@/data/container").__reset(firstRun);
beforeEach(() => resetContainer(false));

const routes = {
  "ajustes-iniciais": () => <Text>Tela de primeiros ajustes</Text>,
  "(tabs)/_layout": TabsLayout,
  "(tabs)/index": Today,
  "(tabs)/quizzes": Quizzes,
  "(tabs)/colecoes": Colecoes,
  "(tabs)/progresso": Progresso,
};

describe("navegação", () => {
  it("abre em Hoje e mostra a barra do design com as 4 abas e o botão Adicionar", async () => {
    await renderRouter(routes);
    expect(await screen.findByText("Vamos revisar?")).toBeTruthy();
    for (const name of ["Hoje", "Coleções", "Quizzes", "Progresso"]) {
      expect(screen.getByRole("tab", { name })).toBeTruthy();
    }
    expect(screen.getByRole("tab", { name: "Hoje" }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole("button", { name: "Adicionar material" })).toBeTruthy();
  });

  it("troca de aba pela barra", async () => {
    await renderRouter(routes);
    await fireEvent.press(await screen.findByRole("tab", { name: "Quizzes" }));
    expect(await screen.findByRole("header", { name: "Quizzes" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Quizzes" }).props.accessibilityState.selected).toBe(true);
  });

  it("o botão + abre a folha Adicionar com as opções de IA em Em breve (flag desligada)", async () => {
    await renderRouter(routes);
    await fireEvent.press(await screen.findByRole("button", { name: "Adicionar material" }));
    expect(await screen.findByText("O que vamos adicionar?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Criar card" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Enviar PDF ou documento, Em breve" })).toBeTruthy();
  });

  it("na primeira abertura (sem configurações) leva para Primeiros ajustes", async () => {
    resetContainer(true);
    await renderRouter(routes);
    expect(await screen.findByText("Tela de primeiros ajustes")).toBeTruthy();
  });
});
