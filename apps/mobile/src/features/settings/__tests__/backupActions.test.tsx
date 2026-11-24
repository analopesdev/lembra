import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { InMemoryCardsRepository } from "@/data/repositories/cards.memory";
import { InMemoryCollectionsRepository } from "@/data/repositories/collections.memory";
import { InMemorySettingsRepository } from "@/data/repositories/settings.memory";
import { makeCard } from "@/data/repositories/cards.contract";
import { makeCollection } from "@/data/repositories/collections.contract";
import { defaultParams } from "@/domain/scheduling";
import { defaultSettings } from "@/domain/settings/settings";
import "@/shared/i18n";

import { ProfileScreen } from "../ProfileScreen";

const mockNow = new Date("2026-03-10T13:00:00Z");
const world: {
  cards: InMemoryCardsRepository;
  collections: InMemoryCollectionsRepository;
  settings: InMemorySettingsRepository;
} = {} as never;

jest.mock("@/data/container", () => ({
  getContainer: () =>
    Promise.resolve({ ...world, now: () => mockNow, newId: () => Math.random().toString(36) }),
}));

const mockSaveText = jest.fn();
const mockPickText = jest.fn();
jest.mock("../backupIo", () => ({
  saveText: (...a: unknown[]) => mockSaveText(...a),
  pickText: () => mockPickText(),
}));

beforeEach(async () => {
  mockSaveText.mockReset();
  mockPickText.mockReset();
  let n = 0;
  const deps = { clock: () => mockNow, newId: () => `o-${n++}`, fsrs: defaultParams() };
  world.cards = new InMemoryCardsRepository(deps);
  world.collections = new InMemoryCollectionsRepository(deps);
  world.settings = new InMemorySettingsRepository(deps);
  await world.settings.save(defaultSettings(mockNow));
  await world.collections.save(makeCollection(1, { id: "col-1", name: "Anatomia" }));
  await world.cards.saveMany([makeCard(1), makeCard(2)]);
});

const press = async (name: string) =>
  act(async () => fireEvent.press(await screen.findByRole("button", { name })));

describe("Perfil: backup", () => {
  it("exporta JSON com todos os cards e avisa", async () => {
    await render(<ProfileScreen onBack={() => undefined} />);
    await press("Exportar e backup");
    await press("Exportar backup completo (JSON)");
    await waitFor(() => expect(mockSaveText).toHaveBeenCalledTimes(1));
    const [name, text, mime] = mockSaveText.mock.calls[0] as [string, string, string];
    expect(name).toBe("lembra-backup-2026-03-10.json");
    expect(mime).toBe("application/json");
    expect(JSON.parse(text).cards).toHaveLength(2);
    expect(await screen.findByText("Backup exportado: 2 cards.")).toBeTruthy();
  });

  it("exporta CSV dos cards", async () => {
    await render(<ProfileScreen onBack={() => undefined} />);
    await press("Exportar e backup");
    await press("Exportar cards (CSV)");
    await waitFor(() => expect(mockSaveText).toHaveBeenCalled());
    const [name, text] = mockSaveText.mock.calls[0] as [string, string];
    expect(name).toBe("lembra-cards-2026-03-10.csv");
    expect(text.split("\r\n")[0]).toBe("colecao,frente,verso,tags,importancia,status");
    expect(await screen.findByText("Cards exportados: 2.")).toBeTruthy();
  });

  it("importa um backup válido numa base vazia", async () => {
    await render(<ProfileScreen onBack={() => undefined} />);
    await press("Exportar e backup");
    await press("Exportar backup completo (JSON)");
    await waitFor(() => expect(mockSaveText).toHaveBeenCalled());
    const text = (mockSaveText.mock.calls[0] as [string, string])[1];
    await world.cards.softDelete(makeCard(1).id);
    await world.cards.softDelete(makeCard(2).id);
    mockPickText.mockResolvedValue(text);
    await press("Exportar e backup");
    await press("Importar backup");
    expect(await screen.findByText(/Backup importado:/)).toBeTruthy();
  });

  it.each([
    ["isto não é json", "Esse arquivo não é um backup do Lembra."],
    [
      JSON.stringify({ format: "lembra-backup", version: 99 }),
      "Esse backup é de uma versão mais nova do app. Atualize o Lembra e tente de novo.",
    ],
  ])("recusa arquivo ruim com mensagem clara", async (content, message) => {
    mockPickText.mockResolvedValue(content);
    await render(<ProfileScreen onBack={() => undefined} />);
    await press("Exportar e backup");
    await press("Importar backup");
    expect(await screen.findByText(message)).toBeTruthy();
  });

  it("cancelar a escolha do arquivo não mostra nada", async () => {
    mockPickText.mockResolvedValue(null);
    await render(<ProfileScreen onBack={() => undefined} />);
    await press("Exportar e backup");
    await press("Importar backup");
    await waitFor(() => expect(mockPickText).toHaveBeenCalled());
    expect(screen.queryByText(/Backup importado|não é um backup/)).toBeNull();
  });

  it("erro inesperado mostra mensagem genérica", async () => {
    mockPickText.mockRejectedValue(new Error("boom"));
    await render(<ProfileScreen onBack={() => undefined} />);
    await press("Exportar e backup");
    await press("Importar backup");
    expect(await screen.findByText("Não deu certo. Tente de novo.")).toBeTruthy();
  });
});
