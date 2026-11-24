/* eslint-disable @typescript-eslint/no-explicit-any */
// SPIKE ADR-0010: contrato do repositório e tela Hoje com 10 mil cards em wa-sqlite/OPFS (Chromium real).
import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

async function result(page: Page, url: string): Promise<Record<string, any>> {
  await page.goto(url);
  const el = page.getByTestId("spike-result");
  await expect(el).not.toHaveText("executando…", { timeout: 120_000 });
  return JSON.parse((await el.textContent()) ?? "{}");
}

test("spike do banco local (web)", async ({ page }) => {
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));

  await page.goto("/dev/feedback");
  const isolated = await page.evaluate(() => ({
    coi: self.crossOriginIsolated,
    opfs: !!navigator.storage?.getDirectory,
  }));
  console.log("ambiente", isolated);
  expect(isolated.coi).toBe(true);

  const contract = await result(page, "/dev/db-spike?phase=contract");
  console.log("contrato", JSON.stringify(contract));
  const seed = await result(page, "/dev/db-spike?phase=seed&n=10000");
  console.log("seed", JSON.stringify(seed));

  const runs: Record<string, any>[] = [];
  for (let i = 0; i < 5; i++) runs.push(await result(page, "/dev/db-spike?phase=today"));
  for (const r of runs) console.log("hoje", JSON.stringify(r));
  for (const r of [contract, seed, ...runs]) expect(r.error, r.error).toBeUndefined();

  mkdirSync("e2e/playwright/results", { recursive: true });
  writeFileSync(
    "e2e/playwright/results/db-spike.json",
    JSON.stringify({ isolated, contract, seed, runs }, null, 2),
  );
  expect(contract.failed).toEqual([]);
});
