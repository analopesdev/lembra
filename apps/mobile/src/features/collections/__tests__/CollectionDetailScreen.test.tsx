import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { InMemoryCardsRepository } from "@/data/repositories/cards.memory";
import { makeCard } from "@/data/repositories/cards.contract";
import { InMemoryCollectionsRepository } from "@/data/repositories/collections.memory";
import { InMemorySettingsRepository } from "@/data/repositories/settings.memory";
import { makeCollection } from "@/data/repositories/collections.contract";
import { defaultParams } from "@/domain/scheduling";
import "@/shared/i18n";

import { CollectionDetailScreen } from "../CollectionDetailScreen";

const mockState: {
  cards: InMemoryCardsRepository | null;
  collections: InMemoryCollectionsRepository | null;
  settings: InMemorySettingsRepository | null;
} = {
  cards: null,
  collections: null,
  settings: null,
};
jest.mock("@/data/container", () => ({
  getContainer: () =>
    Promise.resolve({
      cards: mockState.cards,
      collections: mockState.collections,
      settings: mockState.settings,
      now: () => new Date("2026-03-10T13:00:00Z"),
    }),
}));

let seq = 0;
async function setup(cardCount: number) {
  const deps = {
    clock: () => new Date("2026-03-10T13:00:00Z"),
    newId: () => `o-${seq++}`,
    fsrs: defaultParams(),
  };
  const cards = new InMemoryCardsRepository(deps);
  const collections = new InMemoryCollectionsRepository(deps);
  mockState.cards = cards;
  mockState.collections = collections;
  mockState.settings = new InMemorySettingsRepository(deps);
  await collections.save(makeCollection(1, { id: "col-1", name: "Anatomia I", examDay: "2026-03-22" }));
  await cards.saveMany(
    Array.from({ length: cardCount }, (_, i) =>
      makeCard(i + 1, { front: `Pergunta ${i + 1}`, createdAt: new Date(Date.UTC(2026, 0, 1) + i * 1000) }),
    ),
  );
  return { cards, collections };
}

const handlers = () => ({
  onBack: jest.fn(),
  onEdit: jest.fn(),
  onNewCard: jest.fn(),
  onStudy: jest.fn(),
  onOpenCard: jest.fn(),
  onDeleted: jest.fn(),
});

describe("CollectionDetailScreen", () => {
  it("mostra a coleção, a prova e os cards do mais novo para o mais antigo", async () => {
    await setup(3);
    await render(<CollectionDetailScreen collectionId="col-1" {...handlers()} />);
    expect(await screen.findByText("Anatomia I")).toBeTruthy();
    expect(screen.getByText("dias p/ prova")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText(/^Cards · \d+$/)).toBeTruthy();
    const order = screen.getAllByText(/^Pergunta \d$/).map((n) => n.props.children);
    expect(order).toEqual(["Pergunta 3", "Pergunta 2", "Pergunta 1"]);
  });

  it("pagina: 30 por vez e 'Carregar mais' traz o resto", async () => {
    await setup(35);
    await render(<CollectionDetailScreen collectionId="col-1" {...handlers()} />);
    await screen.findByText("Pergunta 35");
    expect(screen.getAllByText(/^Pergunta \d+$/)).toHaveLength(30);
    await act(async () => fireEvent.press(screen.getByRole("button", { name: "Carregar mais" })));
    await waitFor(() => expect(screen.getAllByText(/^Pergunta \d+$/)).toHaveLength(35));
    expect(screen.queryByRole("button", { name: "Carregar mais" })).toBeNull();
  });

  it("coleção sem cards mostra o aviso", async () => {
    await setup(0);
    await render(<CollectionDetailScreen collectionId="col-1" {...handlers()} />);
    expect(await screen.findByText("Nenhum card nesta coleção.")).toBeTruthy();
  });

  it("cards suspensos aparecem marcados", async () => {
    const { cards } = await setup(1);
    await cards.save(makeCard(1, { front: "Pergunta 1", status: "suspended" }));
    await render(<CollectionDetailScreen collectionId="col-1" {...handlers()} />);
    expect(await screen.findByText("Suspenso")).toBeTruthy();
  });

  it("ações: novo card, editar e abrir um card", async () => {
    await setup(1);
    const h = handlers();
    await render(<CollectionDetailScreen collectionId="col-1" {...h} />);
    await screen.findByText("Pergunta 1");
    await fireEvent.press(screen.getByRole("button", { name: "Novo card" }));
    await fireEvent.press(screen.getByRole("button", { name: "Editar" }));
    await fireEvent.press(screen.getByRole("button", { name: "Pergunta 1" }));
    expect([h.onNewCard.mock.calls.length, h.onEdit.mock.calls.length, h.onOpenCard.mock.calls[0]]).toEqual([
      1,
      1,
      [makeCard(1).id],
    ]);
  });

  it("excluir pede confirmação; cancelar não apaga; confirmar apaga a coleção e os cards", async () => {
    const { cards, collections } = await setup(2);
    await cards.save(makeCard(9, { collectionId: "outra" }));
    const h = handlers();
    await render(<CollectionDetailScreen collectionId="col-1" {...h} />);
    await screen.findByText("Pergunta 1");
    await fireEvent.press(screen.getByRole("button", { name: "Excluir" }));
    expect(await screen.findByText("Excluir coleção?")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
    expect(await collections.get("col-1")).not.toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Excluir" }));
    await act(async () =>
      fireEvent.press(await screen.findByRole("button", { name: "Excluir coleção e cards" })),
    );
    await waitFor(() => expect(h.onDeleted).toHaveBeenCalled());
    expect(await collections.get("col-1")).toBeNull();
    expect([await cards.get(makeCard(1).id), await cards.get(makeCard(2).id)]).toEqual([null, null]);
    expect((await cards.get(makeCard(9).id))?.collectionId).toBe("outra");
  });

  it("botão de estudar mostra os cards prontos e inicia a sessão", async () => {
    await setup(2);
    const h = handlers();
    await render(<CollectionDetailScreen collectionId="col-1" {...h} />);
    await screen.findByText("Pergunta 1");
    await fireEvent.press(screen.getByRole("button", { name: "Estudar Anatomia I" }));
    expect(h.onStudy).toHaveBeenCalled();
    expect(await screen.findByText("2 cards prontos")).toBeTruthy();
    expect(screen.getAllByText("hoje")).toHaveLength(2);
  });
});
