import fc from "fast-check";

import type { Rating } from "../../scheduling";
import {
  currentCard,
  elapsedRatio,
  endSession,
  grade,
  remainingMs,
  reveal,
  startSession,
  summarize,
} from "../review-flow";

const MIN = 60_000;
const T0 = 1_000_000;

function play(ids: string[], minutes: number, answers: { rating: Rating; afterMs: number }[]) {
  let s = startSession(ids, T0, minutes);
  let now = T0;
  const events = [];
  for (const a of answers) {
    if (s.status !== "active") break;
    now += a.afterMs;
    s = reveal(s);
    const r = grade(s, a.rating, now);
    s = r.state;
    if (r.event) events.push(r.event);
  }
  return { s, events };
}

describe("fluxo da sessão (modo clássico)", () => {
  it("começa na frente do primeiro card; revelar mostra o verso; nota avança", () => {
    let s = startSession(["a", "b"], T0, 10);
    expect(currentCard(s)).toEqual({ id: "a", retry: false });
    expect(s.phase).toBe("front");
    s = reveal(s);
    expect(s.phase).toBe("back");
    const r = grade(s, 3, T0 + 8_000);
    expect(r.event).toEqual({ cardId: "a", rating: 3, kind: "review", at: T0 + 8_000, answerMs: 8_000 });
    expect(currentCard(r.state)).toEqual({ id: "b", retry: false });
    expect(r.state.phase).toBe("front");
  });

  it("não aceita nota antes de revelar", () => {
    const s = startSession(["a"], T0, 10);
    const r = grade(s, 3, T0 + 1000);
    expect(r.event).toBeNull();
    expect(r.state).toBe(s);
  });

  it("errou: o card volta no fim da sessão como repetição (ADR-0031)", () => {
    const { s, events } = play(["a", "b", "c"], 10, [
      { rating: 1, afterMs: 5000 },
      { rating: 3, afterMs: 5000 },
      { rating: 4, afterMs: 5000 },
      { rating: 3, afterMs: 5000 },
    ]);
    expect(events.map((e) => [e.cardId, e.kind])).toEqual([
      ["a", "review"],
      ["b", "review"],
      ["c", "review"],
      ["a", "in_session_retry"],
    ]);
    expect(s.status).toBe("finished");
  });

  it("errar a repetição de novo recoloca o card no fim, até acabar o tempo", () => {
    const { s, events } = play(["a"], 1, [
      { rating: 1, afterMs: 10_000 },
      { rating: 1, afterMs: 10_000 },
      { rating: 1, afterMs: 10_000 },
      { rating: 3, afterMs: 10_000 },
    ]);
    expect(events.map((e) => e.kind)).toEqual([
      "review",
      "in_session_retry",
      "in_session_retry",
      "in_session_retry",
    ]);
    expect(s.status).toBe("finished");
  });

  it("RF-16: acabou o tempo → termina o card em andamento e encerra, sem iniciar outro", () => {
    let s = startSession(["a", "b", "c"], T0, 1);
    s = reveal(s);
    const r = grade(s, 3, T0 + MIN + 1);
    expect(r.event?.cardId).toBe("a");
    expect(r.state.status).toBe("finished");
    expect(currentCard(r.state)).toBeNull();
  });

  it("o card em andamento pode ser concluído mesmo passando do tempo", () => {
    let s = startSession(["a", "b"], T0, 1);
    s = reveal(s);
    expect(s.status).toBe("active");
    expect(remainingMs(s, T0 + 2 * MIN)).toBe(0);
    expect(grade(s, 2, T0 + 2 * MIN).event).not.toBeNull();
  });

  it("sessão vazia já nasce encerrada", () => {
    expect(startSession([], T0, 10).status).toBe("finished");
  });

  it("encerrar manualmente (X) limpa a fila e mantém o histórico", () => {
    const { s } = play(["a", "b", "c"], 10, [{ rating: 3, afterMs: 3000 }]);
    const ended = endSession(s);
    expect(ended.status).toBe("finished");
    expect(ended.queue).toEqual([]);
    expect(ended.events).toHaveLength(1);
    expect(endSession(ended)).toBe(ended);
  });

  it("RF-17: resumo conta só as primeiras respostas; repetições à parte", () => {
    const { s } = play(["a", "b", "c"], 10, [
      { rating: 1, afterMs: 4000 },
      { rating: 3, afterMs: 4000 },
      { rating: 2, afterMs: 4000 },
      { rating: 3, afterMs: 4000 },
    ]);
    expect(summarize(s)).toEqual({ reviewed: 3, hits: 2, retries: 1 });
  });

  it("progresso do tempo fica entre 0 e 1", () => {
    const s = startSession(["a"], T0, 10);
    expect(elapsedRatio(s, T0)).toBe(0);
    expect(elapsedRatio(s, T0 + 5 * MIN)).toBe(0.5);
    expect(elapsedRatio(s, T0 + 99 * MIN)).toBe(1);
    expect(elapsedRatio(s, T0 - 5)).toBe(0);
  });

  it("propriedades: toda sessão termina, cada card tem exatamente uma primeira resposta e repetições só depois de errar", () => {
    const ratingArb = fc.constantFrom<Rating>(1, 2, 3, 4);
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 15 }),
        fc.integer({ min: 1, max: 20 }),
        fc.array(fc.tuple(ratingArb, fc.integer({ min: 1000, max: 40_000 })), {
          minLength: 1,
          maxLength: 300,
        }),
        (n, minutes, answers) => {
          const ids = Array.from({ length: n }, (_, i) => `c${i}`);
          const { s, events } = play(
            ids,
            minutes,
            answers.map(([rating, afterMs]) => ({ rating, afterMs })),
          );
          const firsts = events.filter((e) => e.kind === "review").map((e) => e.cardId);
          expect(new Set(firsts).size).toBe(firsts.length);
          for (const e of events.filter((x) => x.kind === "in_session_retry")) {
            const before = events.slice(0, events.indexOf(e));
            expect(before.some((x) => x.cardId === e.cardId && x.rating === 1)).toBe(true);
          }
          if (answers.length >= 300 || s.status === "finished")
            expect(events.length).toBeLessThanOrEqual(answers.length);
          if (s.status === "active") expect(s.queue.length).toBeGreaterThan(0);
        },
      ),
    );
  });
});
