import { defaultParams } from "@/domain/scheduling";

import { InMemoryCollectionsRepository } from "../collections.memory";
import { collectionsContract, type CollectionsEnv } from "../collections.contract";

function env(): CollectionsEnv {
  let now = new Date("2026-03-10T10:00:00.000Z");
  let n = 0;
  let last = "";
  let dup = false;
  const repo = new InMemoryCollectionsRepository({
    clock: () => now,
    fsrs: defaultParams(),
    newId: () => {
      if (dup && last) {
        dup = false;
        return last;
      }
      last = `o-${n++}`;
      return last;
    },
  });
  return { repo, setNow: (d) => (now = d), duplicateNextOutboxId: () => (dup = true) };
}

describe("CollectionsRepository (memória): contrato", () => {
  it.each(collectionsContract.map((c) => [c.name, c] as const))("%s", async (_n, c) => {
    await c.run(env());
  });
});
