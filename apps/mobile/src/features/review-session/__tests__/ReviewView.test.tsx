import React from "react";
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

function Harness(props: { card: Parameters<typeof ReviewView>[0]["card"]; onGrade: (r: number) => void }) {
  const [phase, setPhase] = React.useState<"front" | "back">("front");
  return (
    <ReviewView
      card={props.card}
      phase={phase}
      elapsedRatio={0}
      remainingLabel="5:00"
      onClose={noop}
      onReveal={() => setPhase("back")}
      onGrade={props.onGrade}
    />
  );
}

describe("ReviewView por tipo de card (RF-10, RF-51)", () => {
  it("Digitar: resposta igual ao gabarito sugere Bom", async () => {
    const onGrade = jest.fn();
    await render(<Harness card={{ ...card, kind: "type" }} onGrade={onGrade} />);
    expect(screen.queryByRole("button", { name: "Mostrar resposta" })).toBeNull();
    await fireEvent.changeText(screen.getByLabelText("Sua resposta"), "braquial");
    await fireEvent.press(screen.getByRole("button", { name: "Verificar" }));
    expect(screen.getByText("Igual ao gabarito")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Bom" }).props.accessibilityState.selected).toBe(true);
    await fireEvent.press(screen.getByRole("button", { name: "Próximo card" }));
    expect(onGrade).toHaveBeenLastCalledWith(3);
  });

  it("Digitar: resposta diferente pede a nota antes de seguir", async () => {
    const onGrade = jest.fn();
    await render(<Harness card={{ ...card, kind: "type" }} onGrade={onGrade} />);
    await fireEvent.changeText(screen.getByLabelText("Sua resposta"), "bíceps");
    await fireEvent.press(screen.getByRole("button", { name: "Verificar" }));
    expect(screen.getByText("Diferente do gabarito: compare e escolha a nota")).toBeTruthy();
    expect(screen.getByText("Escolha a nota para continuar")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Próximo card" }));
    expect(onGrade).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("radio", { name: "Errei" }));
    await fireEvent.press(screen.getByRole("button", { name: "Próximo card" }));
    expect(onGrade).toHaveBeenLastCalledWith(1);
  });

  it("Lacuna: a frente esconde a lacuna e o verso mostra a frase completa", async () => {
    const frontDoc = JSON.stringify({
      type: "doc",
      v: 1,
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "O nervo " },
            { type: "cloze", attrs: { id: 1 }, content: [{ type: "text", text: "musculocutâneo" }] },
            { type: "text", text: " inerva o bíceps." },
          ],
        },
      ],
    });
    await render(
      <Harness
        card={{
          ...card,
          kind: "cloze",
          front: "O nervo [...] inerva o bíceps.",
          back: "O nervo musculocutâneo inerva o bíceps.",
          frontDoc,
        }}
        onGrade={noop}
      />,
    );
    expect(screen.queryByText("musculocutâneo")).toBeNull();
    expect(screen.getByText(" [...] ")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Mostrar resposta" }));
    expect(screen.getByText("musculocutâneo")).toBeTruthy();
  });
});
