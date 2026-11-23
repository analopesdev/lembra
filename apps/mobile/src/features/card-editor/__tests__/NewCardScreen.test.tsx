import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { InMemoryCardsRepository } from "@/data/repositories/cards.memory";
import { InMemoryCollectionsRepository } from "@/data/repositories/collections.memory";
import { makeCollection } from "@/data/repositories/collections.contract";
import { defaultParams } from "@/domain/scheduling";
import "@/shared/i18n";

import { NewCardScreen } from "../NewCardScreen";

const mockState: {
  cards: InMemoryCardsRepository | null;
  collections: InMemoryCollectionsRepository | null;
} = { cards: null, collections: null };
let mockSeq = 0;
jest.mock("@/data/container", () => ({
  getContainer: () =>
    Promise.resolve({
      cards: mockState.cards,
      collections: mockState.collections,
      now: () => new Date("2026-03-10T13:00:00Z"),
      newId: () => `card-${mockSeq++}`,
    }),
}));

async function setup(withCollections = true) {
  mockSeq = 0;
  const deps = {
    clock: () => new Date("2026-03-10T13:00:00Z"),
    newId: () => `o-${mockSeq++}`,
    fsrs: defaultParams(),
  };
  const cards = new InMemoryCardsRepository(deps);
  const collections = new InMemoryCollectionsRepository(deps);
  if (withCollections) {
    await collections.save(makeCollection(1, { name: "Anatomia I" }));
    await collections.save(makeCollection(2, { name: "Fisiologia" }));
  }
  mockSeq = 0;
  mockState.cards = cards;
  mockState.collections = collections;
  return { cards, onDone: jest.fn() };
}

const press = async (name: string) =>
  act(async () => fireEvent.press(await screen.findByRole("button", { name })));

describe("NewCardScreen", () => {
  it("salva um card ativo na primeira coleção, com importância média por padrão", async () => {
    const { cards, onDone } = await setup();
    await render(<NewCardScreen onDone={onDone} onClose={() => undefined} />);
    await fireEvent.changeText(
      await screen.findByLabelText("Frente (pergunta)"),
      "  Qual o flexor do cotovelo? ",
    );
    await fireEvent.changeText(screen.getByLabelText("Verso (resposta)"), "Braquial");
    await press("Salvar");
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const saved = await cards.get("card-0");
    expect(saved).toMatchObject({
      front: "Qual o flexor do cotovelo?",
      back: "Braquial",
      status: "active",
      importance: 2,
      collectionId: makeCollection(1).id,
    });
    expect((await cards.pendingOutbox()).map((e) => [e.entity, e.op])).toEqual([["card", "upsert"]]);
  });

  it("escolhe outra coleção e a importância Alta", async () => {
    const { cards, onDone } = await setup();
    await render(<NewCardScreen onDone={onDone} onClose={() => undefined} />);
    await fireEvent.changeText(await screen.findByLabelText("Frente (pergunta)"), "P");
    await fireEvent.changeText(screen.getByLabelText("Verso (resposta)"), "R");
    await fireEvent.press(await screen.findByRole("radio", { name: "Fisiologia" }));
    await fireEvent.press(screen.getByRole("radio", { name: "Alta" }));
    await press("Salvar");
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(await cards.get("card-0")).toMatchObject({ collectionId: makeCollection(2).id, importance: 3 });
  });

  it("frente ou verso vazios mostram erro e não salvam", async () => {
    const { cards, onDone } = await setup();
    await render(<NewCardScreen onDone={onDone} onClose={() => undefined} />);
    await screen.findByRole("radio", { name: "Anatomia I" });
    await press("Salvar");
    expect(await screen.findByText("Escreva a pergunta.")).toBeTruthy();
    expect(screen.getByText("Escreva a resposta.")).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
    expect(await cards.pendingOutbox()).toHaveLength(0);
  });

  it("Salvar e criar outro limpa frente e verso, mantém coleção e avisa", async () => {
    const { cards, onDone } = await setup();
    await render(<NewCardScreen onDone={onDone} onClose={() => undefined} />);
    await fireEvent.changeText(await screen.findByLabelText("Frente (pergunta)"), "P1");
    await fireEvent.changeText(screen.getByLabelText("Verso (resposta)"), "R1");
    await press("Salvar e criar outro");
    expect(await screen.findByText("Card salvo")).toBeTruthy();
    expect(screen.getByLabelText("Frente (pergunta)").props.value).toBe("");
    expect(onDone).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByLabelText("Frente (pergunta)"), "P2");
    await fireEvent.changeText(screen.getByLabelText("Verso (resposta)"), "R2");
    await press("Salvar e criar outro");
    await waitFor(async () => expect(await cards.pendingOutbox()).toHaveLength(2));
    const [first, second] = await Promise.all(
      (await cards.pendingOutbox()).map((e) => cards.get(e.entityId)),
    );
    expect([first?.front, second?.front]).toEqual(["P1", "P2"]);
    expect(first?.collectionId).toBe(second?.collectionId);
  });

  it("sem coleção avisa para criar uma e não deixa salvar", async () => {
    const { cards, onDone } = await setup(false);
    await render(<NewCardScreen onDone={onDone} onClose={() => undefined} />);
    expect(await screen.findByText("Crie uma coleção antes de adicionar cards.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Frente (pergunta)"), "P");
    await fireEvent.changeText(screen.getByLabelText("Verso (resposta)"), "R");
    await press("Salvar");
    expect(await screen.findByText("Escolha uma coleção.")).toBeTruthy();
    expect(await cards.pendingOutbox()).toHaveLength(0);
  });

  it("só o tipo Básico está disponível; os demais ficam Em breve", async () => {
    await setup();
    await render(<NewCardScreen onDone={() => undefined} onClose={() => undefined} />);
    expect(screen.getByRole("radio", { name: "Básico" }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole("radio", { name: "Lacuna, Em breve" }).props.accessibilityState.disabled).toBe(
      true,
    );
  });
});
