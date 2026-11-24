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
    frontDoc: null,
    backDoc: null,
    kind: "basic",
    direction: "forward",
    pairId: null,
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
  {
    name: "recordReview atualiza estado, revlog, cache da tela Hoje e outbox na mesma operação",
    async run({ repo, setNow }) {
      setNow(T0);
      const card = makeCard(1, { importance: 3 });
      await repo.save(card);
      await repo.recordReview({ id: "rev-1", cardId: card.id, at: T0, rating: 3 });
      const state = await repo.getState(card.id);
      assert(state, "estado existe");
      eq(
        [state.reps, state.state, state.lastReview?.toISOString()],
        [1, 2, T0.toISOString()],
        "estado após a revisão",
      );
      assert(state.due.getTime() > T0.getTime(), "vencimento no futuro");
      const log = await repo.listReviews(card.id);
      eq(
        log.map((e) => [e.id, e.rating, e.kind]),
        [["rev-1", 3, "review"]],
        "revlog",
      );
      const outbox = await repo.pendingOutbox();
      eq(
        outbox.filter((e) => e.entity === "review").map((e) => e.entityId),
        ["rev-1"],
        "outbox da revisão",
      );
      const today = await nextValue(repo.watchToday(T0), (v) => v.activeCount === 1);
      eq(
        [today.activeCount, today.retainedCount, today.dueRows.length],
        [1, 1, 0],
        "Hoje: ativo, retido e fora dos vencidos",
      );
    },
  },
  {
    name: "repetição na sessão fica no revlog e não altera o estado (ADR-0031)",
    async run({ repo, setNow }) {
      setNow(T0);
      const card = makeCard(1);
      await repo.save(card);
      await repo.recordReview({ id: "rev-1", cardId: card.id, at: T0, rating: 1 });
      const before = await repo.getState(card.id);
      await repo.recordReview({
        id: "rev-2",
        cardId: card.id,
        at: new Date(T0.getTime() + 600_000),
        rating: 3,
        kind: "in_session_retry",
      });
      eq(await repo.getState(card.id), before, "estado inalterado");
      eq(
        (await repo.listReviews(card.id)).map((e) => [e.id, e.kind]),
        [
          ["rev-1", "review"],
          ["rev-2", "in_session_retry"],
        ],
        "revlog completo",
      );
    },
  },
  {
    name: "recordReview é atômico e idempotente: ID repetido ou outbox falho não deixam rastro",
    async run({ repo, setNow, duplicateNextOutboxId }) {
      setNow(T0);
      const card = makeCard(1);
      await repo.save(card);
      await repo.recordReview({ id: "rev-1", cardId: card.id, at: T0, rating: 3 });
      const stateBefore = await repo.getState(card.id);
      const outboxBefore = (await repo.pendingOutbox()).length;
      let failed = 0;
      duplicateNextOutboxId();
      try {
        await repo.recordReview({
          id: "rev-2",
          cardId: card.id,
          at: new Date(T0.getTime() + 86_400_000),
          rating: 1,
        });
      } catch {
        failed++;
      }
      try {
        await repo.recordReview({
          id: "rev-1",
          cardId: card.id,
          at: new Date(T0.getTime() + 86_400_000),
          rating: 1,
        });
      } catch {
        failed++;
      }
      eq(failed, 2, "as duas devem falhar");
      eq(await repo.getState(card.id), stateBefore, "estado intacto");
      eq((await repo.listReviews(card.id)).length, 1, "revlog intacto");
      eq((await repo.pendingOutbox()).length, outboxBefore, "outbox intacto");
    },
  },
  {
    name: "recordReview em card inexistente ou excluído falha",
    async run({ repo }) {
      let failed = 0;
      try {
        await repo.recordReview({ id: "r", cardId: "nao-existe", at: T0, rating: 3 });
      } catch {
        failed++;
      }
      await repo.save(makeCard(1));
      await repo.softDelete(makeCard(1).id);
      try {
        await repo.recordReview({ id: "r2", cardId: makeCard(1).id, at: T0, rating: 3 });
      } catch {
        failed++;
      }
      eq(failed, 2, "as duas devem falhar");
    },
  },
  {
    name: "rebuildStates recria o cache do zero e dá o mesmo estado do cálculo incremental",
    async run({ repo, setNow }) {
      setNow(T0);
      const DAY = 86_400_000;
      await repo.saveMany([makeCard(1), makeCard(2, { importance: 3 })]);
      const plan: [string, number, number, 1 | 2 | 3 | 4][] = [
        ["a1", 0, 1, 3],
        ["a2", 2, 1, 3],
        ["a3", 7, 1, 1],
        ["a4", 8, 1, 4],
        ["b1", 0, 2, 3],
        ["b2", 3, 2, 2],
      ];
      for (const [id, days, n, rating] of plan)
        await repo.recordReview({
          id,
          cardId: makeCard(n).id,
          at: new Date(T0.getTime() + days * DAY),
          rating,
        });
      const before = [await repo.getState(makeCard(1).id), await repo.getState(makeCard(2).id)];
      const total = await repo.rebuildStates();
      eq(total, 2, "cards reconstruídos");
      eq(
        [await repo.getState(makeCard(1).id), await repo.getState(makeCard(2).id)],
        before,
        "estados iguais após o rebuild",
      );
      eq(await repo.rebuildStates(), 2, "idempotente");
      const today = await nextValue(
        repo.watchToday(new Date(T0.getTime() + 8 * DAY)),
        (v) => v.activeCount === 2,
      );
      eq(today.retainedCount >= 1, true, "retained_until reconstruído");
    },
  },
  {
    name: "watchToday agrupa por coleção (ativos, retidos) e os vencidos trazem a coleção",
    async run({ repo, setNow }) {
      setNow(T0);
      await repo.saveMany([
        makeCard(1, { collectionId: "col-a" }),
        makeCard(2, { collectionId: "col-a" }),
        makeCard(3, { collectionId: "col-b" }),
        makeCard(4, { collectionId: "col-b", status: "suspended" }),
      ]);
      await repo.recordReview({ id: "r1", cardId: makeCard(1).id, at: T0, rating: 3 });
      const today = await nextValue(repo.watchToday(T0), (v) => v.activeCount === 3 && v.retainedCount === 1);
      const stats = Object.fromEntries(
        today.byCollection.map((c) => [c.collectionId, [c.active, c.retained]]),
      );
      eq(stats, { "col-a": [2, 1], "col-b": [1, 0] }, "por coleção");
      eq(
        today.dueRows.map((r) => [r.id, r.collectionId]).sort(),
        [
          [makeCard(2).id, "col-a"],
          [makeCard(3).id, "col-b"],
        ],
        "vencidos com coleção",
      );
    },
  },
  {
    name: "mover o card de coleção atualiza o agrupamento da tela Hoje",
    async run({ repo, setNow }) {
      setNow(T0);
      await repo.saveMany([makeCard(1, { collectionId: "col-a" }), makeCard(2, { collectionId: "col-a" })]);
      await repo.save(makeCard(2, { collectionId: "col-b", updatedAt: new Date(T0.getTime() + 1000) }));
      const today = await nextValue(repo.watchToday(T0), (v) => v.byCollection.length === 2);
      eq(
        Object.fromEntries(today.byCollection.map((c) => [c.collectionId, c.active])),
        { "col-a": 1, "col-b": 1 },
        "agrupamento depois da mudança",
      );
    },
  },
  {
    name: "watchCards: mais novos primeiro, página com limite e hasMore, sem excluídos, de uma só coleção",
    async run({ repo, setNow }) {
      setNow(T0);
      const at = (n: number) => new Date(T0.getTime() + n * 1000);
      await repo.saveMany([
        makeCard(1, { createdAt: at(1) }),
        makeCard(2, { createdAt: at(2), status: "suspended" }),
        makeCard(3, { createdAt: at(3) }),
        makeCard(4, { createdAt: at(4) }),
        makeCard(5, { createdAt: at(5), collectionId: "outra" }),
      ]);
      await repo.softDelete(makeCard(4).id);
      const page1 = await nextValue(repo.watchCards({ collectionId: "col-1", limit: 2 }), () => true);
      eq(
        [page1.items.map((c) => c.id), page1.hasMore],
        [[makeCard(3).id, makeCard(2).id], true],
        "primeira página",
      );
      const all = await nextValue(repo.watchCards({ collectionId: "col-1", limit: 10 }), () => true);
      eq(
        [all.items.map((c) => c.id), all.hasMore],
        [[makeCard(3).id, makeCard(2).id, makeCard(1).id], false],
        "tudo",
      );
    },
  },
  {
    name: "editar o card (save) atualiza o texto e a lista reativa, preservando o estado de estudo",
    async run({ repo, setNow }) {
      setNow(T0);
      await repo.save(makeCard(1));
      await repo.recordReview({ id: "r1", cardId: makeCard(1).id, at: T0, rating: 3 });
      const before = await repo.getState(makeCard(1).id);
      await repo.save(
        makeCard(1, { front: "Editada", importance: 3, updatedAt: new Date(T0.getTime() + 5000) }),
      );
      const page = await nextValue(
        repo.watchCards({ collectionId: "col-1", limit: 5 }),
        (v) => v.items[0]?.front === "Editada",
      );
      eq([page.items[0]?.back, page.items[0]?.importance], ["verso 1", 3], "campos");
      eq(await repo.getState(makeCard(1).id), before, "estado FSRS preservado");
    },
  },
  {
    name: "suspender tira o card da revisão e reativar o devolve, sem perder o histórico",
    async run({ repo, setNow }) {
      setNow(T0);
      await repo.save(makeCard(1));
      const due = await nextValue(repo.watchToday(T0), (v) => v.dueRows.length === 1);
      eq(due.activeCount, 1, "ativo");
      await repo.save(makeCard(1, { status: "suspended", updatedAt: new Date(T0.getTime() + 1000) }));
      const off = await nextValue(repo.watchToday(T0), (v) => v.activeCount === 0);
      eq([off.dueRows.length, off.byCollection.length], [0, 0], "fora da revisão");
      await repo.save(makeCard(1, { status: "active", updatedAt: new Date(T0.getTime() + 2000) }));
      const on = await nextValue(repo.watchToday(T0), (v) => v.activeCount === 1);
      eq(on.dueRows.length, 1, "de volta");
    },
  },
  {
    name: "softDeleteByCollection exclui só os cards da coleção, tira da revisão e enfileira um delete por card",
    async run({ repo, setNow }) {
      setNow(T0);
      await repo.saveMany([makeCard(1), makeCard(2), makeCard(3, { collectionId: "outra" })]);
      const before = (await repo.pendingOutbox()).length;
      eq(await repo.softDeleteByCollection("col-1"), 2, "quantidade excluída");
      eq(await repo.softDeleteByCollection("col-1"), 0, "idempotente");
      eq([await repo.get(makeCard(1).id), await repo.get(makeCard(2).id)], [null, null], "cards ocultos");
      eq((await repo.get(makeCard(3).id))?.collectionId, "outra", "outra coleção intacta");
      const today = await nextValue(repo.watchToday(T0), (v) => v.activeCount === 1);
      eq(
        today.byCollection.map((c) => c.collectionId),
        ["outra"],
        "só a outra coleção ativa",
      );
      const deletes = (await repo.pendingOutbox()).slice(before).filter((e) => e.op === "delete");
      eq(deletes.length, 2, "um delete por card");
    },
  },
  {
    name: "listAll devolve os cards não excluídos de todos os status",
    async run({ repo, setNow }) {
      setNow(T0);
      await repo.saveMany([
        makeCard(1),
        makeCard(2, { status: "suspended" }),
        makeCard(3, { status: "draft" }),
        makeCard(4),
      ]);
      await repo.softDelete(makeCard(4).id);
      const all = await repo.listAll();
      eq(
        all.map((c) => [c.id, c.status]).sort(),
        [
          [makeCard(1).id, "active"],
          [makeCard(2).id, "suspended"],
          [makeCard(3).id, "draft"],
        ].sort(),
        "cards",
      );
    },
  },
  {
    name: "importReviews insere só o que falta, enfileira no outbox e o rebuild reproduz o estado incremental",
    async run({ repo, setNow }) {
      setNow(T0);
      const DAY = 86_400_000;
      await repo.save(makeCard(1));
      await repo.recordReview({ id: "a", cardId: makeCard(1).id, at: T0, rating: 3 });
      await repo.recordReview({
        id: "b",
        cardId: makeCard(1).id,
        at: new Date(T0.getTime() + 2 * DAY),
        rating: 1,
        retention: 0.95,
      });
      const expectedState = await repo.getState(makeCard(1).id);
      const records = await repo.listAllReviews();
      eq(records.length, 2, "dois registros");
      const outboxBefore = (await repo.pendingOutbox()).length;
      eq(await repo.importReviews(records), 0, "já existem: nada novo");
      eq((await repo.pendingOutbox()).length, outboxBefore, "outbox intacto");
      eq(
        await repo.importReviews([
          {
            id: "c",
            cardId: makeCard(1).id,
            at: new Date(T0.getTime() + 2 * DAY + 600_000),
            rating: 3,
            retention: null,
            kind: "in_session_retry",
          },
        ]),
        1,
        "um novo",
      );
      eq((await repo.pendingOutbox()).length, outboxBefore + 1, "uma entrada no outbox");
      await repo.rebuildStates();
      eq(
        await repo.getState(makeCard(1).id),
        expectedState,
        "retry não muda o estado; rebuild bate com o incremental",
      );
      eq((await repo.listAllReviews()).length, 3, "três no histórico");
    },
  },
  {
    name: "conteúdo rico, tipo, direção e par do invertido fazem roundtrip e podem ser atualizados",
    async run({ repo, setNow }) {
      setNow(T0);
      const main = makeCard(1, {
        kind: "reversed",
        frontDoc: '{"type":"doc","v":1,"content":[]}',
        backDoc: null,
      });
      const companion = makeCard(2, {
        kind: "reversed",
        direction: "reverse",
        pairId: main.id,
        front: main.back,
        back: main.front,
      });
      await repo.saveMany([main, companion]);
      eq(await repo.get(main.id), main, "principal");
      eq(await repo.get(companion.id), companion, "companheiro");
      await repo.save({ ...main, frontDoc: null, kind: "basic" });
      const back = await repo.get(main.id);
      assert(back && back.frontDoc === null && back.kind === "basic", "atualiza tipo e conteúdo");
      eq((await repo.get(companion.id))?.pairId, main.id, "par preservado");
    },
  },
];
