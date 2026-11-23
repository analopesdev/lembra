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
    expect(screen.queryByRole("button", { name: "Bom" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Mostrar resposta" }));
    expect(onReveal).toHaveBeenCalled();
  });

  it("no verso mostra a resposta, as 4 notas e o aviso de que só 'Errei' é erro (RF-15)", async () => {
    const onGrade = jest.fn();
    await render(
      <ReviewView
        card={card}
        phase="back"
        elapsedRatio={0.5}
        remainingLabel="5:00"
        onClose={noop}
        onReveal={noop}
        onGrade={onGrade}
      />,
    );
    expect(screen.getByText("Braquial")).toBeTruthy();
    expect(screen.getByText("Só “Errei” conta como erro. Difícil, Bom e Fácil são acertos.")).toBeTruthy();
    for (const [name, rating] of [
      ["Errei", 1],
      ["Difícil", 2],
      ["Bom", 3],
      ["Fácil", 4],
    ] as const) {
      await fireEvent.press(screen.getByRole("button", { name }));
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
