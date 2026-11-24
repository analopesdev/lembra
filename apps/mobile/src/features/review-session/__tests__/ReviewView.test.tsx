import { fireEvent, render, screen } from "@testing-library/react-native";

import { ReviewView } from "../ReviewView";

const card = {
  collectionName: "Anatomia I",
  position: { current: 3, total: 12 },
  front: "Qual o principal flexor do cotovelo?",
  back: "Braquial",
  isRetry: false,
};
const noop = () => undefined;

describe("ReviewView (modo clássico)", () => {
  it("na frente mostra a pergunta e só 'Mostrar resposta'", async () => {
    const onReveal = jest.fn();
    await render(
      <ReviewView
        card={card}
        phase="front"
        elapsedRatio={0.2}
        remainingLabel="8:00"
        onClose={noop}
        onReveal={onReveal}
        onGrade={noop}
      />,
    );
    expect(screen.getByText("Qual o principal flexor do cotovelo?")).toBeTruthy();
    expect(screen.getByText("Card 3 de 12")).toBeTruthy();
    expect(screen.getByText("8:00")).toBeTruthy();
    expect(screen.queryByText("Braquial")).toBeNull();
    expect(screen.queryByRole("radio", { name: "Bom" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Mostrar resposta" }));
    expect(onReveal).toHaveBeenCalled();
  });

  it("no verso mostra a resposta correta, as 4 notas com Bom marcado e confirma com Próximo card (RF-15)", async () => {
    const onGrade = jest.fn();
    await render(
      <ReviewView
        card={card}
        phase="back"
        intervals={{ 1: 1, 2: 4, 3: 9, 4: 21 }}
        elapsedRatio={0.5}
        remainingLabel="5:00"
        onClose={noop}
        onReveal={noop}
        onGrade={onGrade}
      />,
    );
    expect(screen.getByText("Braquial")).toBeTruthy();
    expect(screen.getByText("Resposta correta")).toBeTruthy();
    expect(screen.getByText("Só “Errei” conta como erro. Difícil, Bom e Fácil são acertos.")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Bom" }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByText("Volta em 9 dias")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Próximo card" }));
    expect(onGrade).toHaveBeenLastCalledWith(3);
    for (const [name, rating, text] of [
      ["Errei", 1, "Volta em 1 dia"],
      ["Difícil", 2, "Volta em 4 dias"],
      ["Fácil", 4, "Volta em 21 dias"],
    ] as const) {
      await fireEvent.press(screen.getByRole("radio", { name }));
      expect(screen.getByRole("radio", { name }).props.accessibilityState.selected).toBe(true);
      expect(screen.getByText(text)).toBeTruthy();
      await fireEvent.press(screen.getByRole("button", { name: "Próximo card" }));
      expect(onGrade).toHaveBeenLastCalledWith(rating);
    }
    expect(screen.queryByRole("button", { name: "Mostrar resposta" })).toBeNull();
  });

  it("repetição na sessão avisa que o card volta; fechar chama onClose", async () => {
    const onClose = jest.fn();
    await render(
      <ReviewView
        card={{ ...card, isRetry: true }}
        phase="front"
        elapsedRatio={0}
        remainingLabel="1:00"
        onClose={onClose}
        onReveal={noop}
        onGrade={noop}
      />,
    );
    expect(screen.getByText("Você errou este card: ele volta no fim da sessão.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Encerrar sessão" }));
    expect(onClose).toHaveBeenCalled();
  });
});
