import { fireEvent, render, screen } from "@testing-library/react-native";

import "@/shared/i18n";

import { CollectionsListView } from "../CollectionsListView";

const items = [
  { id: "a", name: "Anatomia I", dueToday: 18, progress: 0.6, tone: "tint" as const, icon: "bone" as const },
  {
    id: "b",
    name: "Fisiologia",
    dueToday: 0,
    progress: 0,
    tone: "collection2" as const,
    icon: "heart" as const,
  },
];

describe("CollectionsListView", () => {
  it("lista as coleções com os vencidos de hoje e abre uma ao tocar", async () => {
    const onOpen = jest.fn();
    await render(<CollectionsListView collections={items} onOpen={onOpen} onCreate={() => undefined} />);
    expect(screen.getByText("18 para hoje")).toBeTruthy();
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
});
