import type { Collection } from "@/domain/types";

import type { Subscribable } from "./cards";
import type { CollectionsRepository } from "./collections";

export interface CollectionsEnv {
  readonly repo: CollectionsRepository;
  setNow(d: Date): void;
  duplicateNextOutboxId(): void;
}

export interface CollectionsCase {
  readonly name: string;
  run(env: CollectionsEnv): Promise<void>;
}

const T0 = new Date("2026-03-10T10:00:00.000Z");

export function makeCollection(n: number, over: Partial<Collection> = {}): Collection {
  return {
    id: `00000000-0000-7000-8000-${String(n).padStart(12, "1")}`,
    name: `Coleção ${n}`,
    icon: "bone",
    tone: "tint",
    examDay: null,
    createdAt: new Date(T0.getTime() + n * 1000),
    updatedAt: new Date(T0.getTime() + n * 1000),
    deletedAt: null,
    ...over,
  };
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`falhou: ${msg}`);
}
const eq = (a: unknown, b: unknown, msg: string) =>
  assert(
    JSON.stringify(a) === JSON.stringify(b),
    `${msg} (obtido ${JSON.stringify(a)}, esperado ${JSON.stringify(b)})`,
  );

function nextValue<T>(src: Subscribable<T>, until: (v: T) => boolean, timeoutMs = 3000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      off();
      reject(new Error("falhou: timeout esperando emissão"));
    }, timeoutMs);
    const off = src.subscribe(
      (v) => {
        if (until(v)) {
          clearTimeout(timer);
          queueMicrotask(off);
          resolve(v);
        }
      },
      (e) => {
        clearTimeout(timer);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

export const collectionsContract: readonly CollectionsCase[] = [
  {
    name: "save + get devolve a mesma coleção (inclui prova e datas)",
    async run({ repo }) {
      const c = makeCollection(1, { examDay: "2026-12-04", icon: "flask", tone: "collection2" });
      await repo.save(c);
      eq(await repo.get(c.id), c, "roundtrip");
    },
  },
  {
    name: "get de ID inexistente devolve null",
    async run({ repo }) {
      eq(await repo.get("nao-existe"), null, "get");
    },
  },
  {
    name: "save de coleção existente atualiza sem duplicar nem mudar a criação",
    async run({ repo, setNow }) {
      setNow(T0);
      const c = makeCollection(1);
      await repo.save(c);
      await repo.save({
        ...c,
        name: "Renomeada",
        examDay: "2027-01-10",
        updatedAt: new Date(T0.getTime() + 60_000),
      });
      const got = await repo.get(c.id);
      eq(
        [got?.name, got?.examDay, got?.createdAt.toISOString()],
        ["Renomeada", "2027-01-10", c.createdAt.toISOString()],
        "atualizada",
      );
      const all = await nextValue(repo.watchAll(), () => true);
      eq(all.length, 1, "sem duplicar");
    },
  },
  {
    name: "toda escrita enfileira uma entrada no outbox, na ordem",
    async run({ repo }) {
      await repo.save(makeCollection(1));
      await repo.save(makeCollection(2));
      await repo.softDelete(makeCollection(1).id);
      eq(
        (await repo.pendingOutbox()).map((e) => [e.entity, e.entityId, e.op]),
        [
          ["collection", makeCollection(1).id, "upsert"],
          ["collection", makeCollection(2).id, "upsert"],
          ["collection", makeCollection(1).id, "delete"],
        ],
        "outbox",
      );
    },
  },
  {
    name: "escrita é atômica: se o outbox falha, a coleção não é gravada",
    async run({ repo, duplicateNextOutboxId }) {
      await repo.save(makeCollection(1));
      duplicateNextOutboxId();
      let failed = false;
      try {
        await repo.save(makeCollection(2));
      } catch {
        failed = true;
      }
      assert(failed, "deve falhar com id de outbox duplicado");
      eq(await repo.get(makeCollection(2).id), null, "coleção 2 não existe");
      eq((await repo.pendingOutbox()).length, 1, "outbox só com a primeira");
    },
  },
  {
    name: "softDelete esconde a coleção e é idempotente",
    async run({ repo }) {
      await repo.save(makeCollection(1));
      await repo.softDelete(makeCollection(1).id);
      await repo.softDelete(makeCollection(1).id);
      eq(await repo.get(makeCollection(1).id), null, "get após excluir");
      eq((await repo.pendingOutbox()).filter((e) => e.op === "delete").length, 1, "um único delete");
    },
  },
  {
    name: "watchAll: ordem de criação, sem excluídas, e reemite após escrita",
    async run({ repo }) {
      await repo.save(makeCollection(3));
      await repo.save(makeCollection(1));
      await repo.save(makeCollection(2));
      const first = await nextValue(repo.watchAll(), (v) => v.length === 3);
      eq(
        first.map((c) => c.name),
        ["Coleção 1", "Coleção 2", "Coleção 3"],
        "ordem por criação",
      );
      await repo.softDelete(makeCollection(2).id);
      const after = await nextValue(repo.watchAll(), (v) => v.length === 2);
      eq(
        after.map((c) => c.name),
        ["Coleção 1", "Coleção 3"],
        "sem a excluída",
      );
    },
  },
];
