import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { InMemoryCardsRepository } from "@/data/repositories/cards.memory";
import { InMemoryCollectionsRepository } from "@/data/repositories/collections.memory";
import { InMemorySettingsRepository } from "@/data/repositories/settings.memory";
import { defaultParams } from "@/domain/scheduling";
import { defaultSettings } from "@/domain/settings/settings";
import { setThemePreference, useThemePreference } from "@/shared/lib/themePreference";
import "@/shared/i18n";

import { ProfileScreen } from "../ProfileScreen";
import { useApplySettings } from "../useApplySettings";

const mockState: { settings: InMemorySettingsRepository | null } = { settings: null };
jest.mock("@/data/container", () => {
  const { InMemoryCardsRepository: Cards } = jest.requireActual("@/data/repositories/cards.memory");
  const { InMemoryCollectionsRepository: Collections } = jest.requireActual(
    "@/data/repositories/collections.memory",
  );
  const { defaultParams: params } = jest.requireActual("@/domain/scheduling");
  const now = () => new Date("2026-03-10T13:00:00Z");
  const deps = { clock: now, newId: () => Math.random().toString(36), fsrs: params() };
  const cards = new Cards(deps);
  const collections = new Collections(deps);
  let n = 0;
  return {
    getContainer: () =>
      Promise.resolve({ cards, collections, settings: mockState.settings, now, newId: () => `seed-${n++}` }),
  };
});

const NOW = new Date("2026-03-10T13:00:00Z");
async function setup() {
  const repo = new InMemorySettingsRepository({
    clock: () => NOW,
    newId: () => Math.random().toString(36),
    fsrs: defaultParams(),
  });
  await repo.save(defaultSettings(NOW));
  mockState.settings = repo;
  void InMemoryCardsRepository;
  void InMemoryCollectionsRepository;
  return repo;
}

describe("ProfileScreen", () => {
  it("mostra os valores atuais e troca o tempo por dia, persistindo", async () => {
    const repo = await setup();
    await render(<ProfileScreen onBack={() => undefined} />);
    expect(
      (await screen.findByRole("radio", { name: "10 minutos por dia" })).props.accessibilityState.selected,
    ).toBe(true);
    await act(async () => fireEvent.press(screen.getByRole("radio", { name: "20 minutos por dia" })));
    await waitFor(async () => expect((await repo.get())?.dailyMinutes).toBe(20));
    expect(screen.getByRole("radio", { name: "20 minutos por dia" }).props.accessibilityState.selected).toBe(
      true,
    );
  });

  it("cards novos por dia: sobe e desce, respeitando 1 a 50", async () => {
    const repo = await setup();
    await render(<ProfileScreen onBack={() => undefined} />);
    await screen.findByText("Cards novos por dia");
    await act(async () => fireEvent.press(screen.getByRole("button", { name: "Mais um card novo por dia" })));
    await waitFor(async () => expect((await repo.get())?.newCardsPerDay).toBe(6));
    for (let i = 0; i < 7; i++)
      await act(async () =>
        fireEvent.press(screen.getByRole("button", { name: "Um card novo a menos por dia" })),
      );
    await waitFor(async () => expect((await repo.get())?.newCardsPerDay).toBe(1));
  });

  it("folgas planejadas: marca e desmarca dias e mantém a ordem", async () => {
    const repo = await setup();
    await render(<ProfileScreen onBack={() => undefined} />);
    await screen.findByText("Folgas planejadas");
    await act(async () => fireEvent.press(screen.getByRole("checkbox", { name: "Domingo" })));
    await act(async () => fireEvent.press(screen.getByRole("checkbox", { name: "Quarta" })));
    await waitFor(async () => expect((await repo.get())?.offWeekdays).toEqual([3, 7]));
    await act(async () => fireEvent.press(screen.getByRole("checkbox", { name: "Domingo" })));
    await waitFor(async () => expect((await repo.get())?.offWeekdays).toEqual([3]));
    expect(screen.getByRole("checkbox", { name: "Quarta" }).props.accessibilityState.checked).toBe(true);
  });

  it("aparência: escolher Escuro grava e é aplicado ao app pela preferência de tema", async () => {
    const repo = await setup();
    setThemePreference("auto");
    const Probe = () => {
      useApplySettings();
      return null;
    };
    const seen: string[] = [];
    const Watch = () => {
      seen.push(useThemePreference());
      return null;
    };
    await render(
      <>
        <Probe />
        <Watch />
        <ProfileScreen onBack={() => undefined} />
      </>,
    );
    await act(async () => fireEvent.press(await screen.findByRole("radio", { name: "Escuro" })));
    await waitFor(async () => expect((await repo.get())?.theme).toBe("dark"));
    await waitFor(() => expect(seen.at(-1)).toBe("dark"));
  });

  it("itens que dependem de conta, servidor ou recursos nativos aparecem como Em breve e desabilitados", async () => {
    await setup();
    await render(<ProfileScreen onBack={() => undefined} />);
    await screen.findByText("Cards novos por dia");
    for (const name of [
      "Sincronização",
      "Exportar e backup",
      "Excluir conta",
      "Desbloquear com Face ID",
      "Lembrete diário",
      "Meta de memória",
    ]) {
      expect(screen.getByLabelText(`${name}, Em breve`).props.accessibilityState.disabled).toBe(true);
    }
  });

  it("Voltar chama onBack", async () => {
    await setup();
    const onBack = jest.fn();
    await render(<ProfileScreen onBack={onBack} />);
    await fireEvent.press(await screen.findByRole("button", { name: "Voltar" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("menu de baixo em vidro: liga e grava", async () => {
    const repo = await setup();
    await render(<ProfileScreen onBack={() => undefined} />);
    await act(async () =>
      fireEvent.press(await screen.findByRole("switch", { name: "Menu de baixo em vidro (liquid glass)" })),
    );
    await waitFor(async () => expect((await repo.get())?.glassNav).toBe(true));
  });
});
