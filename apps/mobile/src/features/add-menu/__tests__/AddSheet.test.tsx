import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { resetFlags, setFlags } from "@/shared/lib/flags";

import { AddSheet } from "../AddSheet";

beforeEach(() => resetFlags());

describe("AddSheet", () => {
  it("com a flag de IA desligada, as opções de IA mostram Em breve e não têm ação", async () => {
    const onChoose = jest.fn();
    await render(<AddSheet visible onClose={() => undefined} onChoose={onChoose} />);
    const pdf = screen.getByRole("button", { name: "Enviar PDF ou documento, Em breve" });
    expect(pdf.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(pdf);
    expect(onChoose).not.toHaveBeenCalled();
    expect(screen.getAllByText("Em breve").length).toBe(3);
  });

  it("com a flag ligada, as opções de IA agem; o layout mantém as mesmas linhas", async () => {
    const onChoose = jest.fn();
    await render(<AddSheet visible onClose={() => undefined} onChoose={onChoose} />);
    const before = screen.getAllByRole("button").length;
    await act(async () => setFlags({ ai_generation: true }));
    expect(screen.getAllByRole("button").length).toBe(before);
    await fireEvent.press(screen.getByRole("button", { name: "Colar um texto" }));
    expect(onChoose).toHaveBeenCalledWith("text");
    expect(screen.getAllByText("Em breve").length).toBe(1);
  });

  it("opções manuais sempre funcionam e a foto segue Em breve (v2)", async () => {
    const onChoose = jest.fn();
    await render(<AddSheet visible onClose={() => undefined} onChoose={onChoose} />);
    await fireEvent.press(screen.getByRole("button", { name: "Criar card" }));
    await fireEvent.press(screen.getByRole("button", { name: "Nova coleção" }));
    expect(onChoose.mock.calls.map((c) => c[0])).toEqual(["card", "collection"]);
    await fireEvent.press(screen.getByRole("button", { name: "Foto de anotação ou slide, Em breve" }));
    expect(onChoose).toHaveBeenCalledTimes(2);
  });

  it("fecha pelo botão", async () => {
    const onClose = jest.fn();
    await render(<AddSheet visible onClose={onClose} onChoose={() => undefined} />);
    await fireEvent.press(screen.getAllByRole("button", { name: "Fechar" })[1]!);
    expect(onClose).toHaveBeenCalled();
  });
});
