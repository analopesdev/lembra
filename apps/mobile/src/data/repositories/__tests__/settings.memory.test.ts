import { defaultParams } from "@/domain/scheduling";

import { InMemorySettingsRepository } from "../settings.memory";
import { settingsContract } from "../settings.contract";

describe("SettingsRepository (memória): contrato", () => {
  it.each(settingsContract.map((c) => [c.name, c] as const))("%s", async (_n, c) => {
    let n = 0;
    const repo = new InMemorySettingsRepository({
      clock: () => new Date(0),
      newId: () => `o-${n++}`,
      fsrs: defaultParams(),
    });
    await c.run({ repo });
  });
});
