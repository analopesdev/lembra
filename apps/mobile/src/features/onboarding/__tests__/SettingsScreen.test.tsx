import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { InMemorySettingsRepository } from "@/data/repositories/settings.memory";
import { sample } from "@/data/repositories/settings.contract";
import { defaultParams } from "@/domain/scheduling";
import "@/shared/i18n";

import { SettingsScreen } from "../SettingsScreen";

const mockState: { settings: InMemorySettingsRepository | null } = { settings: null };
jest.mock("@/data/container", () => ({
  getContainer: () =>
    Promise.resolve({ settings: mockState.settings, now: () => new Date("2026-03-10T13:00:00Z") }),
}));

let n = 0;
const setup = () => {
  const repo = new InMemorySettingsRepository({
    clock: () => new Date(0),
    newId: () => `o-${n++}`,
    fsrs: defaultParams(),
  });
  mockState.settings = repo;
  return { repo, onDone: jest.fn() };
};

describe("SettingsScreen (Primeiros ajustes, RF-01)", () => {
  it("começa em 10 min; escolher 15 e Começar salva e conclui", async () => {
    const { repo, onDone } = setup();
    await render(<SettingsScreen onDone={onDone} />);
    expect(screen.getByRole("radio", { name: "10 minutos por dia" }).props.accessibilityState.selected).toBe(
      true,
    );
    await fireEvent.press(screen.getByRole("radio", { name: "15 minutos por dia" }));
    await act(async () => fireEvent.press(screen.getByRole("button", { name: "Começar" })));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect((await repo.get())?.dailyMinutes).toBe(15);
    expect((await repo.pendingOutbox()).map((e) => e.entity)).toEqual(["settings"]);
  });

  it("Pular grava o padrão (10 min) para a tela não voltar a aparecer", async () => {
    const { repo, onDone } = setup();
    await render(<SettingsScreen onDone={onDone} />);
    await fireEvent.press(screen.getByRole("radio", { name: "5 minutos por dia" }));
    await act(async () => fireEvent.press(screen.getByRole("button", { name: "Pular" })));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect((await repo.get())?.dailyMinutes).toBe(10);
  });

  it("carrega o tempo já salvo e preserva as outras configurações ao salvar", async () => {
    const { repo, onDone } = setup();
    await repo.save(sample({ dailyMinutes: 20, offWeekdays: [7], goalText: "Meta" }));
    await render(<SettingsScreen onDone={onDone} />);
    await waitFor(() =>
      expect(
        screen.getByRole("radio", { name: "20 minutos por dia" }).props.accessibilityState.selected,
      ).toBe(true),
    );
    await fireEvent.press(screen.getByRole("radio", { name: "5 minutos por dia" }));
    await act(async () => fireEvent.press(screen.getByRole("button", { name: "Começar" })));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(await repo.get()).toMatchObject({ dailyMinutes: 5, offWeekdays: [7], goalText: "Meta" });
  });

  it("o lembrete diário aparece desabilitado como Em breve", async () => {
    setup();
    await render(<SettingsScreen onDone={() => undefined} />);
    const toggle = screen.getByRole("switch", { name: "Lembrete diário" });
    expect(toggle.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText("Em breve")).toBeTruthy();
  });
});
