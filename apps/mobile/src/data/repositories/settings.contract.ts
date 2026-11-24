import type { Settings } from "@/domain/settings/settings";

import type { SettingsRepository } from "./settings";

export interface SettingsEnv {
  readonly repo: SettingsRepository;
}

export interface SettingsCase {
  readonly name: string;
  run(env: SettingsEnv): Promise<void>;
}

const at = (n: number) => new Date(Date.UTC(2026, 2, 10, 10, 0, n));

export const sample = (over: Partial<Settings> = {}): Settings => ({
  dailyMinutes: 15,
  newCardsPerDay: 12,
  theme: "dark",
  avatarStyle: "lorelei",
  avatarSeed: "semente-123",
  glassNav: true,
  offWeekdays: [3, 7],
  goalText: "Passar na prova de anatomia",
  updatedAt: at(0),
  ...over,
});

function fail(msg: string): never {
  throw new Error(`falhou: ${msg}`);
}
const eq = (a: unknown, b: unknown, msg: string) => {
  if (JSON.stringify(a) !== JSON.stringify(b))
    fail(`${msg} (obtido ${JSON.stringify(a)}, esperado ${JSON.stringify(b)})`);
};

function firstValue<T>(
  src: { subscribe(f: (v: T) => void): () => void },
  until: (v: T) => boolean,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("falhou: timeout")), 3000);
    const off = src.subscribe((v) => {
      if (until(v)) {
        clearTimeout(timer);
        queueMicrotask(off);
        resolve(v);
      }
    });
  });
}

export const settingsContract: readonly SettingsCase[] = [
  {
    name: "sem configuração salva, get devolve null",
    async run({ repo }) {
      eq(await repo.get(), null, "get");
    },
  },
  {
    name: "save + get devolve as mesmas configurações",
    async run({ repo }) {
      await repo.save(sample());
      eq(await repo.get(), sample(), "roundtrip");
    },
  },
  {
    name: "salvar de novo atualiza a única linha e cada save enfileira no outbox",
    async run({ repo }) {
      await repo.save(sample());
      await repo.save(sample({ dailyMinutes: 5, offWeekdays: [], updatedAt: at(30) }));
      eq((await repo.get())?.dailyMinutes, 5, "minutos atualizados");
      eq(
        (await repo.pendingOutbox()).map((e) => [e.entity, e.op]),
        [
          ["settings", "upsert"],
          ["settings", "upsert"],
        ],
        "outbox",
      );
    },
  },
  {
    name: "watch emite null, depois o valor salvo",
    async run({ repo }) {
      eq(await firstValue(repo.watch(), () => true), null, "inicial");
      await repo.save(sample({ dailyMinutes: 20 }));
      const v = await firstValue(repo.watch(), (x) => x !== null);
      eq(v?.dailyMinutes, 20, "valor salvo");
    },
  },
];
