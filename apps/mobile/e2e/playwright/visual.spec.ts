import { test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const REF = resolve(__dirname, "../../../../docs/lembra-design-kit/referencia");
const OUT = resolve(__dirname, "results/visual");

const SCREENS = [{ name: "hoje", route: "/dev/today", ref: "hoje" }];
const THEMES = [
  { name: "claro", scheme: "light" as const },
  { name: "escuro", scheme: "dark" as const },
];

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });

for (const screen of SCREENS) {
  for (const theme of THEMES) {
    test(`${screen.name} ${theme.name}`, async ({ browser }) => {
      mkdirSync(OUT, { recursive: true });
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        colorScheme: theme.scheme,
      });
      const ref = await ctx.newPage();
      await ref.goto(`file://${REF}/${screen.ref}-${theme.name}.html`);
      await ref.evaluate(() => document.fonts.ready);
      await ref.waitForTimeout(500);
      const refShot = await ref.screenshot();

      const app = await ctx.newPage();
      await app.goto(screen.route);
      await app.evaluate(() => document.fonts.ready);
      await app.waitForTimeout(1200);
      const appShot = await app.screenshot();

      writeFileSync(`${OUT}/${screen.name}-${theme.name}-ref.png`, refShot);
      writeFileSync(`${OUT}/${screen.name}-${theme.name}-app.png`, appShot);

      const side = await ctx.newPage();
      await side.setViewportSize({ width: 800, height: 844 });
      const b64 = (b: Buffer) => `data:image/png;base64,${b.toString("base64")}`;
      await side.setContent(
        `<body style="margin:0;display:flex;gap:20px;background:#888"><img src="${b64(refShot)}"><img src="${b64(appShot)}"></body>`,
      );
      writeFileSync(`${OUT}/${screen.name}-${theme.name}.png`, await side.screenshot());
      await ctx.close();
    });
  }
}
