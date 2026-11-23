import { fireEvent, render, screen } from "@testing-library/react-native";
import { Home } from "lucide-react-native";

import { BottomNav, Button, Card, Input, ProgressBar, Ring, Sheet, Tag, Text, Num } from "..";
import { themes } from "../theme";

describe("Button", () => {
  it("chama onPress e expõe papel e nome", async () => {
    const onPress = jest.fn();
    await render(<Button label="Continuar" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "Continuar" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("desabilitado e carregando não disparam", async () => {
    const onPress = jest.fn();
    await render(
      <>
        <Button label="A" onPress={onPress} disabled />
        <Button label="B" onPress={onPress} loading />
      </>,
    );
    await fireEvent.press(screen.getByRole("button", { name: "A" }));
    await fireEvent.press(screen.getByRole("button", { name: "B" }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("botão principal usa fundo azul aço com texto escuro (nunca branco)", () => {
    expect(themes.claro.button).toBe("#5D91B8");
    expect(themes.claro.onButton).toBe("#171D25");
    expect(themes.escuro.onButton).toBe("#171D25");
  });
});

describe("Input", () => {
  it("rotula o campo, repassa o texto e mostra a dica", async () => {
    const onChangeText = jest.fn();
    await render(<Input label="Nome" hint="Como a coleção aparece" onChangeText={onChangeText} />);
    await fireEvent.changeText(screen.getByLabelText("Nome"), "Anatomia I");
    expect(onChangeText).toHaveBeenCalledWith("Anatomia I");
    expect(screen.getByText("Como a coleção aparece")).toBeTruthy();
  });
});

describe("ProgressBar e Ring", () => {
  it.each([
    [0.62, 62],
    [-1, 0],
    [2, 100],
  ])("ProgressBar %s → %s%%", async (v, now) => {
    await render(<ProgressBar value={v} accessibilityLabel="Progresso" />);
    expect(screen.getByRole("progressbar").props.accessibilityValue).toEqual({ min: 0, max: 100, now });
  });

  it("Ring limita o valor e mostra o conteúdo central", async () => {
    await render(
      <Ring value={1.4} accessibilityLabel="Memória">
        <Num>342</Num>
      </Ring>,
    );
    expect(screen.getByRole("progressbar").props.accessibilityValue.now).toBe(100);
    expect(screen.getByText("342")).toBeTruthy();
  });
});

describe("Tag, Card e Text", () => {
  it("renderiza", async () => {
    await render(
      <Card>
        <Tag label="Em breve" />
        <Text variant="titulo">Hoje</Text>
      </Card>,
    );
    expect(screen.getByText("Em breve")).toBeTruthy();
    expect(screen.getByText("Hoje")).toBeTruthy();
  });
});

describe("Sheet", () => {
  it("só mostra o conteúdo quando visível e fecha pelo fundo", async () => {
    const onClose = jest.fn();
    const { rerender } = await render(
      <Sheet visible={false} onClose={onClose} closeLabel="Fechar">
        <Text>Conteúdo</Text>
      </Sheet>,
    );
    expect(screen.queryByText("Conteúdo")).toBeNull();
    await rerender(
      <Sheet visible onClose={onClose} closeLabel="Fechar">
        <Text>Conteúdo</Text>
      </Sheet>,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("BottomNav", () => {
  const items = [
    { key: "hoje", label: "Hoje", icon: Home },
    { key: "quizzes", label: "Quizzes", icon: Home },
    { key: "colecoes", label: "Coleções", icon: Home },
    { key: "progresso", label: "Progresso", icon: Home },
  ];

  it("marca a aba ativa, navega e abre o botão +", async () => {
    const onSelect = jest.fn();
    const onAdd = jest.fn();
    await render(
      <BottomNav items={items} active="hoje" onSelect={onSelect} onAdd={onAdd} addLabel="Adicionar" />,
    );
    expect(screen.getByRole("tab", { name: "Hoje" }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole("tab", { name: "Quizzes" }).props.accessibilityState.selected).toBe(false);
    await fireEvent.press(screen.getByRole("tab", { name: "Coleções" }));
    expect(onSelect).toHaveBeenCalledWith("colecoes");
    await fireEvent.press(screen.getByRole("button", { name: "Adicionar" }));
    expect(onAdd).toHaveBeenCalled();
  });
});
