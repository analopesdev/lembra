import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { InMemoryCardsRepository } from "@/data/repositories/cards.memory";
import { makeCard } from "@/data/repositories/cards.contract";
import { InMemoryCollectionsRepository } from "@/data/repositories/collections.memory";
import { makeCollection } from "@/data/repositories/collections.contract";
import { defaultParams } from "@/domain/scheduling";
import "@/shared/i18n";

import { ReviewScreen } from "../ReviewScreen";

const mockState: { repo: InMemoryCardsRepository | null; collections: InMemoryCollectionsRepository | null } =
  {
    repo: null,
    collections: null,
  };
const NOW = new Date("2026-03-10T13:00:00Z");

let mockTicks = 0;
jest.mock("@/data/container", () => ({
  getContainer: () =>
    Promise.resolve({
      cards: mockState.repo,
      collections: mockState.collections,
      now: () => new Date(Date.parse("2026-03-10T13:00:00Z") + 1000 * mockTicks++),
    }),
}));

let counter = 0;
beforeEach(() => {
  mockTicks = 0;
});
function newRepo() {
  const repo = new InMemoryCardsRepository({
    clock: () => NOW,
    newId: () => `o-${counter++}`,
    fsrs: defaultParams(),
  });
  mockState.repo = repo;
  mockState.collections = new InMemoryCollectionsRepository({
    clock: () => NOW,
    newId: () => `c-${counter++}`,
    fsrs: defaultParams(),
  });
  return repo;
}

const press = async (name: string) =>
  act(async () => fireEvent.press(await screen.findByRole("button", { name })));

describe("ReviewScreen: sessão clássica ponta a ponta", () => {
  it("sem cards vencidos mostra o estado vazio", async () => {
    newRepo();
    await render(<ReviewScreen onExit={() => undefined} />);
    expect(await screen.findByText("Nada para revisar agora")).toBeTruthy();
  });

  it("vira o card, dá a nota, grava a revisão e termina com o resumo", async () => {
    const repo = newRepo();
    await repo.saveMany([makeCard(1), makeCard(2)]);
    await mockState.collections?.save(makeCollection(1, { id: "col-1", name: "Anatomia I" }));
    const onExit = jest.fn();
    await render(<ReviewScreen onExit={onExit} />);
    expect(await screen.findByText("frente 1")).toBeTruthy();
    expect(await screen.findByText("Anatomia I")).toBeTruthy();
    await press("Mostrar resposta");
    expect(await screen.findByText("verso 1")).toBeTruthy();
    await press("Bom");
    await waitFor(async () => expect((await repo.getState(makeCard(1).id))?.reps).toBe(1));
    expect(await screen.findByText("frente 2")).toBeTruthy();
    await press("Mostrar resposta");
    await press("Fácil");
    expect(await screen.findByText("Sessão concluída")).toBeTruthy();
    expect(screen.getByText("Cards revisados")).toBeTruthy();
    expect(screen.getByText("Acertos")).toBeTruthy();
    expect(screen.queryByText("Repetições na sessão")).toBeNull();
    await press("Voltar para Hoje");
    expect(onExit).toHaveBeenCalled();
  });

  it("errou: o card volta no fim como repetição e só a primeira resposta conta no estado (ADR-0031)", async () => {
    const repo = newRepo();
    await repo.saveMany([makeCard(1), makeCard(2)]);
    await render(<ReviewScreen onExit={() => undefined} />);
    await screen.findByText("frente 1");
    await press("Mostrar resposta");
    await press("Errei");
    await screen.findByText("frente 2");
    await press("Mostrar resposta");
    await press("Bom");
    expect(await screen.findByText("frente 1")).toBeTruthy();
    expect(screen.getByText("Você errou este card: ele volta no fim da sessão.")).toBeTruthy();
    await press("Mostrar resposta");
    await press("Bom");
    expect(await screen.findByText("Sessão concluída")).toBeTruthy();
    const log = await repo.listReviews(makeCard(1).id);
    expect(log.map((e) => [e.rating, e.kind])).toEqual([
      [1, "review"],
      [3, "in_session_retry"],
    ]);
    const state = await repo.getState(makeCard(1).id);
    expect(state?.reps).toBe(1);
    expect(state?.lapses).toBe(0);
  });

  it("encerrar pelo X mostra o resumo do que foi feito", async () => {
    const repo = newRepo();
    await repo.saveMany([makeCard(1), makeCard(2)]);
    await render(<ReviewScreen onExit={() => undefined} />);
    await screen.findByText("frente 1");
    await press("Mostrar resposta");
    await press("Difícil");
    await screen.findByText("frente 2");
    await press("Encerrar sessão");
    expect(await screen.findByText("Sessão concluída")).toBeTruthy();
    expect((await repo.listReviews(makeCard(1).id)).length).toBe(1);
    expect((await repo.listReviews(makeCard(2).id)).length).toBe(0);
  });
});
