import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { makeCard } from "@/data/repositories/cards.contract";
import { InMemoryCardsRepository } from "@/data/repositories/cards.memory";
import { InMemoryCollectionsRepository } from "@/data/repositories/collections.memory";
import { makeCollection } from "@/data/repositories/collections.contract";
import { reversedCompanion } from "@/domain/card/kind";
import { defaultParams } from "@/domain/scheduling";
import "@/shared/i18n";

import { NewCardScreen } from "../NewCardScreen";

jest.mock("../RichEditor", () => {
  const { Text, TextInput } = jest.requireActual("react-native");
  const React = jest.requireActual("react");
  const content = jest.requireActual("@/domain/card/content");
  return {
    RichEditor: ({
      label,
      initialText,
      onChange,
      error,
    }: {
      label: string;
      initialText: string;
      onChange: (v: unknown) => void;
      error?: string;
    }) => {
      const [value, setValue] = React.useState(initialText);
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(TextInput, {
          accessibilityLabel: label,
          value,
          onChangeText: (x: string) => {
            setValue(x);
            const bold = x.startsWith("**");
            const text = bold ? x.slice(2) : x;
            const doc = bold
              ? {
                  type: "doc",
                  v: 1,
                  content: [
                    { type: "paragraph", content: [{ type: "text", text, marks: [{ type: "bold" }] }] },
                  ],
                }
              : content.fromPlainText(text);
            onChange({ text, doc });
          },
        }),
        error ? React.createElement(Text, null, error) : null,
      );
    },
  };
});

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
    await fireEvent.press(await screen.findByRole("button", { name: "Coleção: Anatomia I" }));
    await fireEvent.press(await screen.findByRole("radio", { name: "Fisiologia" }));
    await fireEvent.press(screen.getByRole("radio", { name: "Alta" }));
    await press("Salvar");
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(await cards.get("card-0")).toMatchObject({ collectionId: makeCollection(2).id, importance: 3 });
  });

  it("frente ou verso vazios mostram erro e não salvam", async () => {
    const { cards, onDone } = await setup();
    await render(<NewCardScreen onDone={onDone} onClose={() => undefined} />);
    await screen.findByRole("button", { name: "Coleção: Anatomia I" });
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

  it("os quatro tipos estão disponíveis e Básico vem marcado", async () => {
    await setup();
    await render(<NewCardScreen onDone={() => undefined} onClose={() => undefined} />);
    expect(screen.getByRole("radio", { name: "Básico" }).props.accessibilityState.selected).toBe(true);
    for (const name of ["Invertido", "Lacuna", "Digitar"]) {
      expect(screen.getByRole("radio", { name }).props.accessibilityState.disabled).not.toBe(true);
    }
  });

  it("texto formatado guarda o conteúdo rico junto do texto simples; texto puro não guarda", async () => {
    const { cards, onDone } = await setup();
    await render(<NewCardScreen onDone={onDone} onClose={() => undefined} />);
    await fireEvent.changeText(await screen.findByLabelText("Frente (pergunta)"), "**Flexor");
    await fireEvent.changeText(screen.getByLabelText("Verso (resposta)"), "Braquial");
    await press("Salvar");
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const saved = await cards.get("card-0");
    expect(saved).toMatchObject({ front: "Flexor", back: "Braquial", backDoc: null });
    expect(saved?.frontDoc).toContain('"bold"');
  });

  it("Digitar salva um card do tipo digitar", async () => {
    const { cards, onDone } = await setup();
    await render(<NewCardScreen onDone={onDone} onClose={() => undefined} />);
    await fireEvent.press(await screen.findByRole("radio", { name: "Digitar" }));
    await fireEvent.changeText(screen.getByLabelText("Frente (pergunta)"), "P");
    await fireEvent.changeText(screen.getByLabelText("Verso (resposta)"), "R");
    await press("Salvar");
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(await cards.get("card-0")).toMatchObject({ kind: "type", direction: "forward", pairId: null });
  });

  it("Invertido salva dois cards: o principal e o do sentido contrário, ligados", async () => {
    const { cards, onDone } = await setup();
    await render(<NewCardScreen onDone={onDone} onClose={() => undefined} />);
    await fireEvent.press(await screen.findByRole("radio", { name: "Invertido" }));
    await fireEvent.changeText(screen.getByLabelText("Frente (pergunta)"), "Braquial");
    await fireEvent.changeText(screen.getByLabelText("Verso (resposta)"), "Principal flexor");
    await press("Salvar");
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const main = await cards.get("card-0");
    const companion = await cards.getByPair("card-0");
    expect(main).toMatchObject({ kind: "reversed", direction: "forward", front: "Braquial" });
    expect(companion).toMatchObject({
      kind: "reversed",
      direction: "reverse",
      pairId: "card-0",
      front: "Principal flexor",
      back: "Braquial",
    });
    expect((await cards.pendingOutbox()).filter((e) => e.entity === "card")).toHaveLength(2);
  });

  it("Lacuna: esconde o verso, exige {{ }} e salva a frase com a lacuna escondida na frente", async () => {
    const { cards, onDone } = await setup();
    await render(<NewCardScreen onDone={onDone} onClose={() => undefined} />);
    await fireEvent.press(await screen.findByRole("radio", { name: "Lacuna" }));
    expect(screen.queryByLabelText("Verso (resposta)")).toBeNull();
    await fireEvent.changeText(screen.getByLabelText("Frase com lacunas"), "sem marca");
    await press("Salvar");
    expect(await screen.findByText("Marque pelo menos uma lacuna entre chaves duplas.")).toBeTruthy();
    await fireEvent.changeText(
      screen.getByLabelText("Frase com lacunas"),
      "O nervo {{musculocutâneo}} inerva o bíceps.",
    );
    await press("Salvar");
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(await cards.get("card-0")).toMatchObject({
      kind: "cloze",
      front: "O nervo [...] inerva o bíceps.",
      back: "O nervo musculocutâneo inerva o bíceps.",
    });
  });
});

describe("NewCardScreen: edição", () => {
  const prepare = async (over = {}) => {
    const ctx = await setup();
    await ctx.cards.save(
      makeCard(1, {
        id: "card-edit",
        front: "Pergunta original",
        back: "Resposta original",
        importance: 1,
        collectionId: makeCollection(2).id,
        ...over,
      }),
    );
    return ctx;
  };

  it("carrega o card, salva as mudanças e preserva origem, status e criação", async () => {
    const { cards, onDone } = await prepare();
    const original = await cards.get("card-edit");
    await render(<NewCardScreen cardId="card-edit" onDone={onDone} onClose={() => undefined} />);
    expect(await screen.findByText("Editar card")).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByLabelText("Frente (pergunta)").props.value).toBe("Pergunta original"),
    );
    expect(screen.getByRole("radio", { name: "Baixa" }).props.accessibilityState.selected).toBe(true);
    expect(screen.queryByRole("button", { name: "Salvar e criar outro" })).toBeNull();
    await fireEvent.changeText(screen.getByLabelText("Frente (pergunta)"), "Pergunta nova");
    await fireEvent.press(screen.getByRole("radio", { name: "Alta" }));
    await press("Salvar");
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const saved = await cards.get("card-edit");
    expect(saved).toMatchObject({
      id: "card-edit",
      front: "Pergunta nova",
      back: "Resposta original",
      importance: 3,
      status: "active",
    });
    expect(saved?.createdAt).toEqual(original?.createdAt);
    expect(saved?.collectionId).toBe(makeCollection(2).id);
  });

  it("suspende e reativa, avisando que o card suspenso fica fora das revisões", async () => {
    const { cards } = await prepare();
    await render(<NewCardScreen cardId="card-edit" onDone={() => undefined} onClose={() => undefined} />);
    await press("Suspender");
    await waitFor(async () => expect((await cards.get("card-edit"))?.status).toBe("suspended"));
    expect(await screen.findByText("Este card está suspenso e não entra nas revisões.")).toBeTruthy();
    await press("Reativar");
    await waitFor(async () => expect((await cards.get("card-edit"))?.status).toBe("active"));
    expect(screen.queryByText("Este card está suspenso e não entra nas revisões.")).toBeNull();
  });

  it("excluir pede confirmação: cancelar mantém, confirmar exclui e volta", async () => {
    const { cards, onDone } = await prepare();
    await render(<NewCardScreen cardId="card-edit" onDone={onDone} onClose={() => undefined} />);
    await press("Excluir card");
    expect(await screen.findByText("Excluir card?")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
    expect(await cards.get("card-edit")).not.toBeNull();
    await press("Excluir card");
    await act(async () =>
      fireEvent.press((await screen.findAllByRole("button", { name: "Excluir card" }))[1]!),
    );
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(await cards.get("card-edit")).toBeNull();
    expect((await cards.pendingOutbox()).at(-1)).toMatchObject({ entityId: "card-edit", op: "delete" });
  });
});

describe("NewCardScreen: card invertido na edição", () => {
  const prepareReversed = async () => {
    const ctx = await setup();
    const main = makeCard(1, {
      id: "main",
      kind: "reversed",
      front: "Braquial",
      back: "Flexor",
      collectionId: makeCollection(1).id,
    });
    await ctx.cards.saveMany([main, reversedCompanion(main, "comp")]);
    return ctx;
  };

  it("editar o principal atualiza o companheiro; abrir o companheiro edita o principal", async () => {
    const { cards, onDone } = await prepareReversed();
    await render(<NewCardScreen cardId="comp" onDone={onDone} onClose={() => undefined} />);
    await waitFor(() => expect(screen.getByLabelText("Frente (pergunta)").props.value).toBe("Braquial"));
    await fireEvent.changeText(screen.getByLabelText("Frente (pergunta)"), "Bíceps braquial");
    await press("Salvar");
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect((await cards.get("main"))?.front).toBe("Bíceps braquial");
    expect(await cards.get("comp")).toMatchObject({ back: "Bíceps braquial", front: "Flexor" });
  });

  it("excluir o principal exclui o companheiro; suspender acompanha", async () => {
    const { cards } = await prepareReversed();
    await render(<NewCardScreen cardId="main" onDone={() => undefined} onClose={() => undefined} />);
    await press("Suspender");
    await waitFor(async () => expect((await cards.get("comp"))?.status).toBe("suspended"));
    await press("Excluir card");
    await act(async () =>
      fireEvent.press((await screen.findAllByRole("button", { name: "Excluir card" }))[1]!),
    );
    await waitFor(async () => expect(await cards.get("main")).toBeNull());
    expect(await cards.get("comp")).toBeNull();
  });

  it("trocar de Invertido para Básico exclui o companheiro", async () => {
    const { cards, onDone } = await prepareReversed();
    await render(<NewCardScreen cardId="main" onDone={onDone} onClose={() => undefined} />);
    await fireEvent.press(await screen.findByRole("radio", { name: "Básico" }));
    await press("Salvar");
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(await cards.get("comp")).toBeNull();
    expect((await cards.get("main"))?.kind).toBe("basic");
  });
});
