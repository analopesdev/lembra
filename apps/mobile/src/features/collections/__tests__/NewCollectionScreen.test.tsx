import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { makeCollection } from "@/data/repositories/collections.contract";
import { InMemoryCollectionsRepository } from "@/data/repositories/collections.memory";
import { defaultParams } from "@/domain/scheduling";
import "@/shared/i18n";

import { NewCollectionScreen } from "../NewCollectionScreen";

const mockState: { repo: InMemoryCollectionsRepository | null } = { repo: null };
let mockSeq = 0;
jest.mock("@/data/container", () => ({
  getContainer: () =>
    Promise.resolve({
      collections: mockState.repo,
      now: () => new Date("2026-03-10T13:00:00Z"),
      newId: () => `col-${mockSeq++}`,
    }),
}));

function setup() {
  mockSeq = 0;
  const repo = new InMemoryCollectionsRepository({
    clock: () => new Date("2026-03-10T13:00:00Z"),
    newId: () => `o-${mockSeq++}`,
    fsrs: defaultParams(),
  });
  mockState.repo = repo;
  const onDone = jest.fn();
  return { repo, onDone };
}

const submit = async () =>
  act(async () => fireEvent.press(await screen.findByRole("button", { name: "Criar coleção" })));

describe("NewCollectionScreen", () => {
  it("nome vazio mostra o erro e não salva", async () => {
    const { repo, onDone } = setup();
    await render(<NewCollectionScreen onDone={onDone} onBack={() => undefined} />);
    await submit();
    expect(await screen.findByText("Dê um nome à coleção.")).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
    expect(await repo.pendingOutbox()).toHaveLength(0);
  });

  it("cria a coleção com ícone, cor e prova, e volta", async () => {
    const { repo, onDone } = setup();
    await render(<NewCollectionScreen onDone={onDone} onBack={() => undefined} />);
    await fireEvent.changeText(screen.getByLabelText("Nome"), "  Anatomia   I ");
    await fireEvent.press(screen.getByRole("radio", { name: "Frasco" }));
    await fireEvent.press(screen.getByRole("radio", { name: "Azul claro" }));
    await fireEvent.changeText(screen.getByLabelText("Data da prova (opcional)"), "04122026");
    expect(screen.getByLabelText("Data da prova (opcional)").props.value).toBe("04/12/2026");
    expect(screen.getByText(/Prova em \d+ dias/)).toBeTruthy();
    await submit();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const saved = await repo.get("col-0");
    expect(saved).toMatchObject({
      name: "Anatomia I",
      icon: "flask",
      tone: "collection2",
      examDay: "2026-12-04",
      deletedAt: null,
    });
    expect((await repo.pendingOutbox()).map((e) => e.op)).toEqual(["upsert"]);
  });

  it("data inválida e data passada mostram erros diferentes", async () => {
    const { onDone } = setup();
    await render(<NewCollectionScreen onDone={onDone} onBack={() => undefined} />);
    await fireEvent.changeText(screen.getByLabelText("Nome"), "Fisiologia");
    await fireEvent.changeText(screen.getByLabelText("Data da prova (opcional)"), "31022027");
    await submit();
    expect(await screen.findByText("Use o formato DD/MM/AAAA.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Data da prova (opcional)"), "01012020");
    await submit();
    expect(await screen.findByText("A data da prova não pode ser no passado.")).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("sem data de prova a coleção é criada sem prova", async () => {
    const { repo, onDone } = setup();
    await render(<NewCollectionScreen onDone={onDone} onBack={() => undefined} />);
    await fireEvent.changeText(screen.getByLabelText("Nome"), "Bioquímica");
    await submit();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect((await repo.get("col-0"))?.examDay).toBeNull();
  });
});

describe("NewCollectionScreen: edição", () => {
  const seed = (over = {}) => {
    const ctx = setup();
    return ctx.repo
      .save(
        makeCollection(1, {
          id: "col-x",
          name: "Anatomia I",
          icon: "heart",
          tone: "collection2",
          examDay: "2026-12-04",
          ...over,
        }),
      )
      .then(() => ctx);
  };

  it("carrega os dados atuais e salva mantendo id e data de criação", async () => {
    const { repo, onDone } = await seed();
    const original = await repo.get("col-x");
    await render(<NewCollectionScreen collectionId="col-x" onDone={onDone} onBack={() => undefined} />);
    expect(await screen.findByText("Editar coleção")).toBeTruthy();
    await waitFor(() => expect(screen.getByLabelText("Nome").props.value).toBe("Anatomia I"));
    expect(screen.getByLabelText("Data da prova (opcional)").props.value).toBe("04/12/2026");
    await fireEvent.changeText(screen.getByLabelText("Nome"), "Anatomia II");
    await act(async () => fireEvent.press(await screen.findByRole("button", { name: "Salvar alterações" })));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const saved = await repo.get("col-x");
    expect(saved).toMatchObject({
      id: "col-x",
      name: "Anatomia II",
      icon: "heart",
      tone: "collection2",
      examDay: "2026-12-04",
    });
    expect(saved?.createdAt).toEqual(original?.createdAt);
    expect((await repo.pendingOutbox()).map((e) => e.op)).toEqual(["upsert", "upsert"]);
  });

  it("prova que já passou e não foi alterada não bloqueia o salvamento", async () => {
    const { repo, onDone } = await seed({ examDay: "2026-03-01" });
    await render(<NewCollectionScreen collectionId="col-x" onDone={onDone} onBack={() => undefined} />);
    await waitFor(() =>
      expect(screen.getByLabelText("Data da prova (opcional)").props.value).toBe("01/03/2026"),
    );
    await fireEvent.changeText(screen.getByLabelText("Nome"), "Renomeada");
    await act(async () => fireEvent.press(await screen.findByRole("button", { name: "Salvar alterações" })));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect((await repo.get("col-x"))?.examDay).toBe("2026-03-01");
  });

  it("trocar para uma data passada é recusado; limpar a data remove a prova", async () => {
    const { repo, onDone } = await seed();
    await render(<NewCollectionScreen collectionId="col-x" onDone={onDone} onBack={() => undefined} />);
    await waitFor(() => expect(screen.getByLabelText("Nome").props.value).toBe("Anatomia I"));
    await fireEvent.changeText(screen.getByLabelText("Data da prova (opcional)"), "01012020");
    await act(async () => fireEvent.press(await screen.findByRole("button", { name: "Salvar alterações" })));
    expect(await screen.findByText("A data da prova não pode ser no passado.")).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByLabelText("Data da prova (opcional)"), "");
    await act(async () => fireEvent.press(await screen.findByRole("button", { name: "Salvar alterações" })));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect((await repo.get("col-x"))?.examDay).toBeNull();
  });
});
