import { defaultParams } from "@/domain/scheduling";
import { uuidv7 } from "@/shared/lib/uuidv7";

import { cardsContract, type ContractEnv } from "../cards.contract";
import { InMemoryCardsRepository } from "../cards.memory";

function env(): ContractEnv {
  let now = new Date("2026-03-10T10:00:00.000Z");
  let n = 0;
  let last = "";
  let dup = false;
  const repo = new InMemoryCardsRepository({
    clock: () => now,
    fsrs: defaultParams(),
    newId: () => {
      if (dup && last) {
        dup = false;
        return last;
      }
      last = uuidv7(now.getTime() + n++, (len) => new Uint8Array(len).fill(n));
      return last;
    },
  });
  return { repo, setNow: (d) => (now = d), duplicateNextOutboxId: () => (dup = true) };
}

describe("CardsRepository (memória): contrato", () => {
  it.each(cardsContract.map((c) => [c.name, c] as const))("%s", async (_n, c) => {
    await c.run(env());
  });
});
