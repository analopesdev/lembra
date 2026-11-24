import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("CRUD de coleções e cards pela interface, com o SQLite real", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await expect(page.getByText(/Revise antes/)).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Começar" }).click();
  await expect(page.getByRole("heading", { name: "Primeiros ajustes" })).toBeVisible();
  await page.getByRole("radio", { name: "15 minutos por dia" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Comprometo-me" }).click();
  await expect(page.getByText("Vamos revisar?")).toBeVisible();
  await expect(page.getByText("15 min")).toBeVisible();

  await page.getByRole("tab", { name: "Coleções" }).click();
  await expect(page.getByText("Nenhuma coleção ainda")).toBeVisible();

  await page.getByRole("button", { name: "Nova coleção" }).last().click();
  await page.getByLabel("Nome").fill("Anatomia I");
  await page.getByRole("button", { name: "Ícone e cor" }).click();
  await page.getByRole("radio", { name: "Ícone droplet" }).click();
  await page.getByRole("button", { name: "Pronto" }).click();
  await page.getByLabel("Data da prova (opcional)").fill("04122099");
  await page.getByRole("button", { name: "Criar coleção" }).click();

  await expect(page.getByRole("button", { name: /^Anatomia I/ })).toBeVisible();
  await page.getByRole("button", { name: /^Anatomia I/ }).click();
  await expect(page.getByRole("heading", { name: "Anatomia I" })).toBeVisible();
  await expect(page.getByText("Nenhum card nesta coleção.")).toBeVisible();

  await page.getByRole("button", { name: "Novo card" }).first().click();
  await page.getByLabel("Frente (pergunta)").fill("Qual o principal flexor do cotovelo?");
  await page.getByLabel("Verso (resposta)").fill("Braquial");
  await page.getByRole("radio", { name: "Alta" }).click();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();

  await expect(page.getByRole("button", { name: "Qual o principal flexor do cotovelo?" })).toBeVisible();

  await page.getByRole("button", { name: "Qual o principal flexor do cotovelo?" }).click();
  await expect(page.getByRole("heading", { name: "Editar card" })).toBeVisible();
  await expect(page.getByLabel("Verso (resposta)")).toHaveValue("Braquial");
  await page.getByLabel("Frente (pergunta)").fill("Qual músculo flexiona o cotovelo?");
  await page.getByRole("button", { name: "Suspender" }).click();
  await expect(page.getByText("Este card está suspenso e não entra nas revisões.")).toBeVisible();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();

  await expect(page.getByRole("button", { name: "Qual músculo flexiona o cotovelo?" })).toBeVisible();
  await expect(page.getByText("Suspenso")).toBeVisible();

  await page.getByRole("button", { name: "Qual músculo flexiona o cotovelo?" }).click();
  await page.getByRole("button", { name: "Excluir card" }).first().click();
  await page.getByRole("button", { name: "Excluir card" }).last().click();
  await expect(page.getByText("Nenhum card nesta coleção.")).toBeVisible();

  await page.getByRole("button", { name: "Editar" }).click();
  await expect(page.getByRole("heading", { name: "Editar coleção" })).toBeVisible();
  await expect(page.getByLabel("Nome")).toHaveValue("Anatomia I");
  await page.getByLabel("Nome").fill("Anatomia II");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("heading", { name: "Anatomia II" })).toBeVisible();

  await page.getByRole("button", { name: "Excluir" }).first().click();
  await page.getByRole("button", { name: "Excluir coleção e cards" }).click();
  await expect(page.getByText("Nenhuma coleção ainda")).toBeVisible();

  expect(errors).toEqual([]);
});
