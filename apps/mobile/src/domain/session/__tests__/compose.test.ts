import { defaultParams } from "../../scheduling";
import { composeSession, type DueRow } from "../compose";

const TZ = "America/Sao_Paulo";
const NOW = new Date("2026-03-10T13:00:00Z");
const DAY = 86_400_000;
const params = defaultParams();

const review = (
  id: string,
  dueOffsetDays: number,
  stability: number,
  lastDaysAgo: number,
  importance: 1 | 2 | 3 = 2,
): DueRow => ({
  id,
  importance,
  due: new Date(NOW.getTime() + dueOffsetDays * DAY),
  stability,
  lastReview: new Date(NOW.getTime() - lastDaysAgo * DAY),
});
const fresh = (id: string, importance: 1 | 2 | 3, createdDaysAgo: number): DueRow => ({
  id,
  importance,
  due: new Date(NOW.getTime() - createdDaysAgo * DAY),
  stability: 0,
  lastReview: null,
});

const input = (rows: DueRow[], over = {}) => ({
  rows,
  now: NOW,
  timeZone: TZ,
  minutes: 10,
  params,
  newCardsLeftToday: 5,
  ...over,
});

describe("composeSession", () => {
  it("revisões de hoje por V decrescente (mais esquecido primeiro)", () => {
    const ids = composeSession(
      input(
        [review("lembrado", 0, 30, 2), review("esquecido", 0, 2, 10), review("meio", 0, 10, 10)].map((r) => ({
          ...r,
          due: new Date(NOW.getTime() - 3_600_000),
        })),
      ),
    );
    expect(ids).toEqual(["esquecido", "meio", "lembrado"]);
  });

  it("atrasados entram depois das de hoje e dívida bloqueia cards novos", () => {
    const rows = [review("hoje", 0, 5, 5), review("atrasado", -3, 5, 8), fresh("novo", 3, 1)].map((r) =>
      r.id === "hoje" ? { ...r, due: new Date(NOW.getTime() - 3_600_000) } : r,
    );
    expect(composeSession(input(rows))).toEqual(["hoje", "atrasado"]);
  });

  it("sem dívida, novos entram por importância e depois criação, até o limite do dia", () => {
    const ids = composeSession(
      input([fresh("n1", 1, 5), fresh("n2", 3, 2), fresh("n3", 3, 9)], { newCardsLeftToday: 2 }),
    );
    expect(ids).toEqual(["n3", "n2"]);
  });

  it("respeita a capacidade do tempo escolhido", () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({
      ...review(`c${String(i).padStart(3, "0")}`, 0, 5, 7),
      due: new Date(NOW.getTime() - 3_600_000),
    }));
    expect(composeSession(input(rows, { minutes: 5 }))).toHaveLength(20);
    expect(composeSession(input(rows, { minutes: 10 }))).toHaveLength(40);
  });

  it("vencer hoje pela virada das 4h não é dívida", () => {
    const row = { ...review("a", 0, 5, 5), due: new Date("2026-03-10T07:30:00Z") };
    const out = composeSession(input([row, fresh("n", 2, 1)]));
    expect(out).toEqual(["a", "n"]);
  });

  it("sem cards: sessão vazia", () => {
    expect(composeSession(input([]))).toEqual([]);
  });
});
