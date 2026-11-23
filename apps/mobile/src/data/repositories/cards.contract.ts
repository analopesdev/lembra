// Suíte de contrato do CardsRepository: roda contra TODAS as implementações (memória, SQLite native/web).
// Sem dependência de framework: cada caso lança erro se falhar. Jest e a página de spike a executam.
import type { Card } from "@/domain/types";

import type { CardsRepository, Subscribable } from "./cards";

export interface ContractEnv {
  readonly repo: CardsRepository;
  /** Relógio controlável da implementação sob teste. */
  setNow(d: Date): void;
  /** Faz o próximo ID de outbox gerado repetir o anterior (força falha dentro da transação). */
  duplicateNextOutboxId(): void;
}

export interface ContractCase {
  readonly name: string;
  run(env: ContractEnv): Promise<void>;
}

export const T0 = new Date("2026-03-10T10:00:00.000Z");

export function makeCard(n: number, over: Partial<Card> = {}): Card {
  const id = `00000000-0000-7000-8000-${String(n).padStart(12, "0")}`;
  return {
    id,
    collectionId: "col-1",
    front: `frente ${n}`,
    back: `verso ${n}`,
    tags: ["a", "b"],
    importance: 2,
    status: "active",
    createdAt: T0,
    updatedAt: T0,
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

/** Espera o próximo valor emitido que satisfaça `until`, com timeout. */
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

export const cardsContract: readonly ContractCase[] = [
  {
    name: "save + get devolve o mesmo card (inclui tags e datas)",
    async run({ repo }) {
      const c = makeCard(1);
      await repo.save(c);
      const got = await repo.get(c.id);
      assert(got, "card salvo deve existir");
      eq({ ...got, tags: [...got.tags] }, { ...c, tags: [...c.tags] }, "roundtrip");
      assert(
        got.createdAt instanceof Date && got.createdAt.getTime() === T0.getTime(),
        "datas voltam como Date UTC",
      );
    },
  },
  {
    name: "get de ID inexistente devolve null",
    async run({ repo }) {
      eq(await repo.get("nao-existe"), null, "get");
    },
  },
  {
    name: "save de card existente atualiza (upsert) sem duplicar",
    async run({ repo }) {
      await repo.save(makeCard(1));
      await repo.save(makeCard(1, { front: "novo" }));
      eq((await repo.get(makeCard(1).id))?.front, "novo", "frente atualizada");
    },
  },
  {
    name: "toda escrita enfileira exatamente uma entrada no outbox, na ordem",
    async run({ repo }) {
      await repo.save(makeCard(1));
      await repo.save(makeCard(2));
      await repo.softDelete(makeCard(1).id);
      const ob = await repo.pendingOutbox();
      eq(
        ob.map((e) => [e.entityId, e.op]),
        [
          [makeCard(1).id, "upsert"],
          [makeCard(2).id, "upsert"],
          [makeCard(1).id, "delete"],
        ],
        "outbox",
      );
    },
  },
  {
    name: "escrita é atômica: se o outbox falha, o card não é gravado",
    async run({ repo, duplicateNextOutboxId }) {
      await repo.save(makeCard(1));
      duplicateNextOutboxId();
      let failed = false;
      try {
        await repo.save(makeCard(2));
      } catch {
        failed = true;
      }
      assert(failed, "save deve falhar com id de outbox duplicado");
      eq(await repo.get(makeCard(2).id), null, "card 2 não deve existir");
      eq((await repo.pendingOutbox()).length, 1, "outbox só tem a primeira entrada");
    },
  },
  {
    name: "saveMany é tudo ou nada",
    async run({ repo, duplicateNextOutboxId }) {
      await repo.save(makeCard(9));
      duplicateNextOutboxId();
      let failed = false;
      try {
        await repo.saveMany([makeCard(1), makeCard(2), makeCard(3)]);
      } catch {
        failed = true;
      }
      assert(failed, "saveMany deve falhar com id de outbox duplicado");
      for (const n of [1, 2, 3]) eq(await repo.get(makeCard(n).id), null, `card ${n} não deve existir`);
      eq((await repo.pendingOutbox()).length, 1, "outbox só tem a entrada anterior");
      await repo.saveMany([makeCard(1), makeCard(2), makeCard(3)]);
      eq((await repo.pendingOutbox()).length, 4, "lote bem-sucedido enfileira 3");
    },
  },
  {
    name: "softDelete esconde o card do get e é idempotente",
    async run({ repo }) {
      await repo.save(makeCard(1));
      await repo.softDelete(makeCard(1).id);
      await repo.softDelete(makeCard(1).id);
      eq(await repo.get(makeCard(1).id), null, "get após excluir");
      eq((await repo.pendingOutbox()).filter((e) => e.op === "delete").length, 1, "um único delete");
    },
  },
  {
    name: "rascunho não entra no agendador até ser aprovado (RF-23)",
    async run({ repo, setNow }) {
      setNow(T0);
      await repo.save(makeCard(1, { status: "draft" }));
      const before = await nextValue(repo.watchDue(T0), () => true);
      eq(before.length, 0, "rascunho fora de watchDue");
      await repo.approveDrafts([makeCard(1).id]);
      const after = await nextValue(repo.watchDue(T0), (v) => v.length === 1);
      eq(after[0]?.card.status, "active", "aprovado fica ativo");
      eq(after[0]?.state.state, 0, "estado inicial: novo");
    },
  },
  {
    name: "watchDue: só ativos vencidos, ordenados por vencimento e ID; exclui suspensos e excluídos",
    async run({ repo, setNow }) {
      setNow(T0);
      await repo.saveMany([
        makeCard(3),
        makeCard(1),
        makeCard(2, { status: "suspended" }),
        makeCard(4, { status: "problematic" }),
      ]);
      await repo.save(makeCard(5));
      await repo.softDelete(makeCard(5).id);
      const due = await nextValue(repo.watchDue(T0), (v) => v.length === 2);
      eq(
        due.map((x) => x.card.id),
        [makeCard(1).id, makeCard(3).id],
        "ordem estável por ID em empate de vencimento",
      );
      const future = await nextValue(repo.watchDue(new Date(T0.getTime() - 1)), () => true);
      eq(future.length, 0, "nada vence antes de T0");
    },
  },
  {
    name: "consulta reativa: reemite após escrita e para após cancelar a assinatura",
    async run({ repo, setNow }) {
      setNow(T0);
      const seen: number[] = [];
      const off = repo.watchActive().subscribe((v) => seen.push(v.length));
      await nextValue(repo.watchActive(), (v) => v.length === 0);
      await repo.save(makeCard(1));
      await nextValue(repo.watchActive(), (v) => v.length === 1);
      assert(seen.includes(1), "assinatura viva recebeu a mudança");
      off();
      const count = seen.length;
      await repo.save(makeCard(2));
      await nextValue(repo.watchActive(), (v) => v.length === 2);
      eq(seen.length, count, "assinatura cancelada não recebe mais nada");
    },
  },
];
