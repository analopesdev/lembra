import { parseBackup, serializeBackup } from "@/domain/backup/backup";
import { defaultParams } from "@/domain/scheduling";
import { defaultSettings } from "@/domain/settings/settings";

import { createBackup, restoreBackup, type BackupDeps } from "../backup";
import { makeCard } from "../repositories/cards.contract";
import { InMemoryCardsRepository } from "../repositories/cards.memory";
import { makeCollection } from "../repositories/collections.contract";
import { InMemoryCollectionsRepository } from "../repositories/collections.memory";
import { InMemorySettingsRepository } from "../repositories/settings.memory";

const NOW = new Date("2026-03-10T13:00:00Z");
const DAY = 86_400_000;

function world(): BackupDeps {
  let n = 0;
  const deps = { clock: () => NOW, newId: () => `o-${n++}`, fsrs: defaultParams() };
  return {
    cards: new InMemoryCardsRepository(deps),
    collections: new InMemoryCollectionsRepository(deps),
    settings: new InMemorySettingsRepository(deps),
    now: () => NOW,
  };
}

async function populate(d: BackupDeps) {
  await d.collections.save(makeCollection(1, { id: "col-1", name: "Anatomia I", examDay: "2026-12-04" }));
  await d.cards.saveMany([
    makeCard(1),
    makeCard(2, { status: "suspended" }),
    makeCard(3, { front: "Com, vírgula" }),
  ]);
  await d.cards.recordReview({ id: "r1", cardId: makeCard(1).id, at: NOW, rating: 3 });
  await d.cards.recordReview({
    id: "r2",
    cardId: makeCard(1).id,
    at: new Date(NOW.getTime() + 3 * DAY),
    rating: 1,
    retention: 0.95,
  });
  await d.cards.recordReview({
    id: "r3",
    cardId: makeCard(1).id,
    at: new Date(NOW.getTime() + 3 * DAY + 600_000),
    rating: 3,
    kind: "in_session_retry",
  });
  await d.settings.save({
    ...defaultSettings(NOW),
    dailyMinutes: 15,
    newCardsPerDay: 12,
    theme: "dark",
    offWeekdays: [3, 7],
    goalText: "Passar",
  });
}

describe("backup: exportar e restaurar (RF-45)", () => {
  it("critério de aceite: exportar, restaurar numa base vazia e obter cards, histórico e estado idênticos", async () => {
    const a = world();
    await populate(a);
    const text = serializeBackup(await createBackup(a));
    const parsed = parseBackup(text);
    if (!parsed.ok) throw new Error(parsed.error);

    const b = world();
    const summary = await restoreBackup(b, parsed.file);
    expect(summary).toEqual({ collections: 1, cards: 3, reviews: 3, settings: true });

    expect(await b.collections.listAll()).toEqual(await a.collections.listAll());
    expect(await b.cards.listAll()).toEqual(await a.cards.listAll());
    expect([...(await b.cards.listAllReviews())].sort((x, y) => (x.id < y.id ? -1 : 1))).toEqual(
      [...(await a.cards.listAllReviews())].sort((x, y) => (x.id < y.id ? -1 : 1)),
    );
    expect(await b.settings.get()).toEqual(await a.settings.get());
    for (const n of [1, 2, 3])
      expect(await b.cards.getState(makeCard(n).id)).toEqual(await a.cards.getState(makeCard(n).id));
  });

  it("restaurar duas vezes não duplica nada (idempotente)", async () => {
    const a = world();
    await populate(a);
    const file = await createBackup(a);
    const b = world();
    await restoreBackup(b, file);
    const second = await restoreBackup(b, file);
    expect(second).toEqual({ collections: 0, cards: 0, reviews: 0, settings: false });
    expect(await b.cards.listAll()).toHaveLength(3);
    expect(await b.cards.listAllReviews()).toHaveLength(3);
  });

  it("última edição vence: backup mais antigo não sobrescreve o que está no aparelho", async () => {
    const a = world();
    await populate(a);
    const file = await createBackup(a);
    const b = world();
    await restoreBackup(b, file);
    await b.cards.save(makeCard(1, { front: "Editada depois", updatedAt: new Date(NOW.getTime() + DAY) }));
    await restoreBackup(b, file);
    expect((await b.cards.get(makeCard(1).id))?.front).toBe("Editada depois");
  });

  it("backup mais novo atualiza o card local", async () => {
    const a = world();
    await populate(a);
    const b = world();
    await restoreBackup(b, await createBackup(a));
    await a.cards.save(makeCard(1, { front: "Versão nova", updatedAt: new Date(NOW.getTime() + DAY) }));
    const s = await restoreBackup(b, await createBackup(a));
    expect(s.cards).toBe(1);
    expect((await b.cards.get(makeCard(1).id))?.front).toBe("Versão nova");
  });

  it("não exporta cards nem coleções excluídos, nem revisões de cards excluídos", async () => {
    const a = world();
    await populate(a);
    await a.cards.softDelete(makeCard(1).id);
    const file = await createBackup(a);
    expect(file.cards.map((c) => c.id)).not.toContain(makeCard(1).id);
    expect(file.reviews).toEqual([]);
  });

  it("restauração enfileira o que importou no outbox para o sync", async () => {
    const a = world();
    await populate(a);
    const b = world();
    await restoreBackup(b, await createBackup(a));
    const entities = (await b.cards.pendingOutbox()).map((e) => e.entity);
    expect(entities.filter((e) => e === "card")).toHaveLength(3);
    expect(entities.filter((e) => e === "review")).toHaveLength(3);
    expect(await b.collections.pendingOutbox()).toHaveLength(1);
    expect(await b.settings.pendingOutbox()).toHaveLength(1);
  });

  it("exportar uma base vazia gera um arquivo válido que restaura sem erro", async () => {
    const empty = world();
    const parsed = parseBackup(serializeBackup(await createBackup(empty)));
    expect(parsed.ok).toBe(true);
    if (parsed.ok)
      expect(await restoreBackup(world(), parsed.file)).toEqual({
        collections: 0,
        cards: 0,
        reviews: 0,
        settings: false,
      });
  });

  it("tipo, conteúdo rico e par do invertido sobrevivem ao backup", async () => {
    const a = world();
    await a.collections.save(makeCollection(1, { id: "col-1" }));
    const main = makeCard(1, { kind: "reversed", frontDoc: '{"type":"doc","v":1,"content":[]}' });
    const companion = makeCard(2, { kind: "reversed", direction: "reverse", pairId: main.id });
    await a.cards.saveMany([main, companion]);
    const parsed = parseBackup(serializeBackup(await createBackup(a)));
    if (!parsed.ok) throw new Error(parsed.error);
    const b = world();
    await restoreBackup(b, parsed.file);
    expect(await b.cards.get(main.id)).toEqual(main);
    expect(await b.cards.get(companion.id)).toEqual(companion);
  });

  it("backup antigo, sem os campos novos, restaura como card básico", async () => {
    const a = world();
    await a.collections.save(makeCollection(1, { id: "col-1" }));
    await a.cards.save(makeCard(1));
    const file = await createBackup(a);
    const old = JSON.parse(serializeBackup(file));
    for (const c of old.cards)
      for (const k of ["frontDoc", "backDoc", "kind", "direction", "pairId"]) delete c[k];
    const parsed = parseBackup(JSON.stringify(old));
    if (!parsed.ok) throw new Error(parsed.error);
    const b = world();
    await restoreBackup(b, parsed.file);
    expect(await b.cards.get(makeCard(1).id)).toMatchObject({
      kind: "basic",
      direction: "forward",
      pairId: null,
      frontDoc: null,
    });
  });
});
