import { fireEvent, render, screen } from "@testing-library/react-native";

import "@/shared/i18n";

import { IntroScreen } from "../IntroScreen";

const next = async (name: string) => fireEvent.press(screen.getByRole("button", { name }));

describe("IntroScreen (Apresentação, 3 passos)", () => {
  it("passo 1: mensagem da curva da memória, progresso e Pular", async () => {
    await render(<IntroScreen onDone={() => undefined} />);
    expect(screen.getByText(/Revise antes/)).toBeTruthy();
    expect(screen.getByRole("tablist", { name: "Apresentação, passo 1 de 3" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pular" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeTruthy();
  });

  it("Continuar avança pelos 3 passos; só o último troca para Começar e esconde Pular", async () => {
    const onDone = jest.fn();
    await render(<IntroScreen onDone={onDone} />);
    await next("Continuar");
    expect(screen.getByText(/Seu material/)).toBeTruthy();
    expect(screen.getByRole("tablist", { name: "Apresentação, passo 2 de 3" })).toBeTruthy();
    await next("Continuar");
    expect(screen.getByText(/Poucos minutos/)).toBeTruthy();
    expect(screen.getByRole("tablist", { name: "Apresentação, passo 3 de 3" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Pular" })).toBeNull();
    expect(onDone).not.toHaveBeenCalled();
    await next("Começar");
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("Pular conclui a apresentação em qualquer passo anterior ao último", async () => {
    const onDone = jest.fn();
    await render(<IntroScreen onDone={onDone} />);
    await next("Continuar");
    await next("Pular");
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("a ilustração da curva tem descrição para leitores de tela", async () => {
    await render(<IntroScreen onDone={() => undefined} />);
    expect(screen.getByLabelText(/Curva da memória/)).toBeTruthy();
  });
});
