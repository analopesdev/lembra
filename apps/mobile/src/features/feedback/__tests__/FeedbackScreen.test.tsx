import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import "@/shared/i18n";

import { FeedbackScreen } from "../FeedbackScreen";

const send = async () =>
  act(async () => fireEvent.press(await screen.findByRole("button", { name: "Enviar" })));
const type = (text: string) => fireEvent.changeText(screen.getByLabelText("Mensagem"), text);

describe("FeedbackScreen", () => {
  it("envia tipo, mensagem sem espaços sobrando e a escolha dos dados do aparelho", async () => {
    const sendFn = jest.fn().mockResolvedValue(undefined);
    await render(<FeedbackScreen send={sendFn} onBack={() => undefined} replyTo="ana@email.com" />);
    await fireEvent.press(screen.getByRole("radio", { name: "Reclamação" }));
    await type("  Está lento  ");
    await fireEvent.press(screen.getByRole("switch", { name: "Incluir dados do aparelho" }));
    await send();
    await waitFor(() =>
      expect(sendFn).toHaveBeenCalledWith({
        type: "complaint",
        message: "Está lento",
        includeDeviceInfo: false,
      }),
    );
    expect(await screen.findByText("Mensagem enviada. Obrigada!")).toBeTruthy();
    expect(screen.getByLabelText("Mensagem").props.value).toBe("");
  });

  it("começa em Sugestão e com os dados do aparelho ligados", async () => {
    const sendFn = jest.fn().mockResolvedValue(undefined);
    await render(<FeedbackScreen send={sendFn} onBack={() => undefined} replyTo={null} />);
    expect(screen.getByRole("radio", { name: "Sugestão" }).props.accessibilityState.selected).toBe(true);
    expect(
      screen.getByRole("switch", { name: "Incluir dados do aparelho" }).props.accessibilityState.checked,
    ).toBe(true);
    await type("ok");
    await send();
    await waitFor(() =>
      expect(sendFn).toHaveBeenCalledWith({ type: "suggestion", message: "ok", includeDeviceInfo: true }),
    );
  });

  it("mensagem vazia mostra erro e não envia", async () => {
    const sendFn = jest.fn();
    await render(<FeedbackScreen send={sendFn} onBack={() => undefined} replyTo={null} />);
    await type("   ");
    await send();
    expect(await screen.findByText("Escreva a sua mensagem.")).toBeTruthy();
    expect(sendFn).not.toHaveBeenCalled();
  });

  it("mensagem acima de 2000 caracteres é recusada", async () => {
    const sendFn = jest.fn();
    await render(<FeedbackScreen send={sendFn} onBack={() => undefined} replyTo={null} />);
    await type("a".repeat(2001));
    await send();
    expect(await screen.findByText("A mensagem pode ter até 2000 caracteres.")).toBeTruthy();
    expect(sendFn).not.toHaveBeenCalled();
  });

  it("falha no envio mantém o texto e mostra o erro", async () => {
    const sendFn = jest.fn().mockRejectedValue(new Error("rede"));
    await render(<FeedbackScreen send={sendFn} onBack={() => undefined} replyTo={null} />);
    await type("Preciso de ajuda");
    await send();
    expect(await screen.findByText("Não foi possível enviar. Tente de novo.")).toBeTruthy();
    expect(screen.getByLabelText("Mensagem").props.value).toBe("Preciso de ajuda");
    expect(screen.queryByText("Mensagem enviada. Obrigada!")).toBeNull();
  });

  it("mostra o contador, o e-mail de resposta e deixa o anexo como Em breve", async () => {
    await render(<FeedbackScreen send={jest.fn()} onBack={() => undefined} replyTo="ana@email.com" />);
    await type("abc");
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("2000")).toBeTruthy();
    expect(screen.getByText("A resposta vai para ana@email.com")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Anexar print da tela (opcional), Em breve" }).props
        .accessibilityState.disabled,
    ).toBe(true);
  });

  it("voltar chama onBack", async () => {
    const onBack = jest.fn();
    await render(<FeedbackScreen send={jest.fn()} onBack={onBack} replyTo={null} />);
    await fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(onBack).toHaveBeenCalled();
  });
});
