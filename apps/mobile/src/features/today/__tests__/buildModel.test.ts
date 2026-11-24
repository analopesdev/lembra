import type { TodaySummary } from "@/data/repositories/cards";
import type { Collection } from "@/domain/types";

import { buildTodayModel } from "../buildModel";

const NOW = new Date("2026-03-10T13:00:00Z");
const DAY = 86_400_000;
const TZ = "America/Sao_Paulo";

const collection = (id: string, name: string, over: Partial<Collection> = {}): Collection => ({
  id,
  name,
  icon: "bone",
  tone: "tint",
  examDay: null,
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
  ...over,
});

const row = (id: string, collectionId: string | null, dueOffsetDays: number, reviewed = true) => ({
  id,
  collectionId,
  importance: 2 as const,
  due: new Date(NOW.getTime() + dueOffsetDays * DAY - 3_600_000),
  stability: reviewed ? 5 : 0,
  lastReview: reviewed ? new Date(NOW.getTime() - 7 * DAY) : null,
});

const summary = (over: Partial<TodaySummary> = {}): TodaySummary => ({
  activeCount: 0,
  retainedCount: 0,
  byCollection: [],
  dueRows: [],
  ...over,
});

const build = (s: TodaySummary, collections: Collection[] = []) =>
  buildTodayModel({
    summary: s,
    collections,
    now: NOW,
    timeZone: TZ,
    sessionMinutes: 10,
    newCardsLeftToday: 5,
    retentionTargetPct: 90,
  });

describe("buildTodayModel", () => {
  it("banco vazio: nada a revisar, sem coleções nem prova", () => {
    expect(build(summary())).toMatchObject({
      memoryRetained: 0,
      memoryRatio: 0,
      dueCount: 0,
      caughtUpInDays: null,
      collections: [],
      exam: null,
    });
  });

  it("memória retida e razão vêm do resumo", () => {
    const m = build(summary({ activeCount: 10, retainedCount: 7 }));
    expect([m.memoryRetained, m.memoryRatio]).toEqual([7, 0.7]);
  });

  it("cada coleção mostra vencidos de hoje e a razão de memória retida", () => {
    const m = build(
      summary({
        activeCount: 5,
        retainedCount: 3,
        byCollection: [
          { collectionId: "a", active: 4, retained: 3 },
          { collectionId: "b", active: 1, retained: 0 },
        ],
        dueRows: [row("1", "a", 0), row("2", "a", 0), row("3", "b", 0)],
      }),
      [
        collection("a", "Anatomia I", { tone: "collection2", icon: "heart" }),
        collection("b", "Fisiologia"),
        collection("c", "Vazia"),
      ],
    );
    expect(m.collections.map((c) => [c.name, c.dueToday, c.progress, c.tone, c.icon])).toEqual([
      ["Anatomia I", 2, 0.75, "collection2", "heart"],
      ["Fisiologia", 1, 0, "tint", "bone"],
      ["Vazia", 0, 0, "tint", "bone"],
    ]);
  });

  it("a sessão pronta é limitada pelo tempo escolhido (40 cards em 10 min)", () => {
    const rows = Array.from({ length: 100 }, (_, i) => row(`c${String(i).padStart(3, "0")}`, "a", 0));
    expect(build(summary({ dueRows: rows })).dueCount).toBe(40);
  });

  it("RF-08: com atrasados, mostra 'em dia em N dias' e não revela o total atrasado", () => {
    const overdue = Array.from({ length: 60 }, (_, i) => row(`o${String(i).padStart(3, "0")}`, "a", -3));
    const m = build(summary({ dueRows: [row("t1", "a", 0), ...overdue] }));
    expect(m.dueCount).toBeLessThanOrEqual(40);
    expect(m.caughtUpInDays).toBe(Math.ceil(60 / 12));
  });

  it("sem atrasados não mostra previsão de dívida", () => {
    expect(build(summary({ dueRows: [row("1", "a", 0)] })).caughtUpInDays).toBeNull();
  });

  it("a prova mais próxima (hoje ou futura) aparece; passadas e coleções sem prova são ignoradas", () => {
    const m = build(summary(), [
      collection("a", "Passada", { examDay: "2026-03-01" }),
      collection("b", "Longe", { examDay: "2026-12-04" }),
      collection("c", "Perto", { examDay: "2026-03-22" }),
      collection("d", "Sem prova"),
    ]);
    expect(m.exam).toEqual({ name: "Perto", daysLeft: 12, readinessPct: null });
  });

  it("prova no dia de hoje conta como 0 dias", () => {
    expect(build(summary(), [collection("a", "Hoje", { examDay: "2026-03-10" })]).exam?.daysLeft).toBe(0);
  });

  it("cards novos entram na sessão só sem dívida", () => {
    const novo = row("n", "a", 0, false);
    expect(build(summary({ dueRows: [novo] })).dueCount).toBe(1);
    expect(build(summary({ dueRows: [novo, row("o", "a", -3)] })).dueCount).toBe(1);
  });
});
