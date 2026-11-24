import { fireEvent, render, screen } from "@testing-library/react-native";

import "@/shared/i18n";

import { CollectionsListView } from "../CollectionsListView";

const items = [
  {
    id: "a",
    name: "Anatomia I",
    dueToday: 18,
    progress: 0.6,
    cardCount: 64,
    examDaysLeft: 12,
    tone: "tint" as const,
    icon: "bone" as const,
  },
  {
    id: "b",
    name: "Fisiologia",
    dueToday: 0,
    progress: 0,
    cardCount: 51,
    examDaysLeft: null,
    tone: "collection2" as const,
    icon: "heart" as const,
  },
];

describe("CollectionsListView", () => {
  it("lista as coleções com os vencidos de hoje e abre uma ao tocar", async () => {
    const onOpen = jest.fn();
    await render(<CollectionsListView collections={items} onOpen={onOpen} onCreate={() => undefined} />);
    expect(screen.getByText(/18 para hoje.*64 cards/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Fisiologia, 0 para hoje" }));
    expect(onOpen).toHaveBeenCalledWith("b");
  });

  it("sem coleções convida a criar a primeira", async () => {
    const onCreate = jest.fn();
    await render(<CollectionsListView collections={[]} onOpen={() => undefined} onCreate={onCreate} />);
    expect(screen.getByText("Nenhuma coleção ainda")).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Nova coleção" })[1]!);
    expect(onCreate).toHaveBeenCalled();
  });

  it("mostra os totais, a etiqueta de prova e o percentual retido", async () => {
    await render(
      <CollectionsListView collections={items} onOpen={() => undefined} onCreate={() => undefined} />,
    );
    expect(screen.getByText("coleções")).toBeTruthy();
    expect(screen.getByText("cards no total")).toBeTruthy();
    expect(screen.getByText("115")).toBeTruthy();
    expect(screen.getByText("Prova em 12 dias")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Anatomia I: 60% retido" })).toBeTruthy();
    expect(screen.queryByText("Prova em 1 dia")).toBeNull();
  });
});
