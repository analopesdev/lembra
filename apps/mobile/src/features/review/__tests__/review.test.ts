import { initialState } from "@/domain/scheduling";
import type { Card, CardWithState } from "@/domain/types";

import { buildQueue } from "../queue";
import { currentOutcome, initialReviewState, reviewReducer } from "../reducer";

const at = new Date("2026-11-22T15:00:00Z");

function item(id: string, over: Partial<CardWithState["state"]> = {}): CardWithState {
  const card: Card = {
    id,
    collectionId: "c",
    front: `f${id}`,
    back: `b${id}`,
    tags: [],
    importance: 2,
    status: "active",
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
  };
  return { card, state: { ...initialState(at), ...over } };
}

describe("reducer da revisão", () => {
  const queue = [item("a"), item("b")];

  it("percorre responder, resultado e próximo, acumulando o resultado", () => {
    let s = initialReviewState(queue);
    expect(s.phase).toBe("answering");
    s = reviewReducer(s, { type: "type", text: "x" });
    s = reviewReducer(s, { type: "submit", rating: 4, seconds: 5, at });
    expect(s.phase).toBe("result");
    s = reviewReducer(s, { type: "adjust", rating: 2 });
    expect(currentOutcome(s)).toMatchObject({ cardId: "a", rating: 2, suggested: 4 });
    s = reviewReducer(s, { type: "next" });
    expect(s).toMatchObject({ index: 1, phase: "answering", answer: "" });
    expect(s.outcomes).toHaveLength(1);
  });

  it("não sei registra De novo", () => {
    let s = initialReviewState(queue);
    s = reviewReducer(s, { type: "giveUp", seconds: 3, at });
    expect(s).toMatchObject({ phase: "result", rating: 1, skipped: true });
  });

  it("tempo esgotado no meio de um card deixa terminar o card em andamento", () => {
    let s = initialReviewState(queue);
    s = reviewReducer(s, { type: "submit", rating: 3, seconds: 4, at });
    s = reviewReducer(s, { type: "expire" });
    expect(s.phase).toBe("result");
    s = reviewReducer(s, { type: "next" });
    expect(s.phase).toBe("summary");
    expect(s.outcomes).toHaveLength(1);
  });

  it("tempo esgotado antes de responder encerra a sessão", () => {
    const s = reviewReducer(initialReviewState(queue), { type: "expire" });
    expect(s.phase).toBe("summary");
  });

  it("fila vazia começa no resumo", () => {
    expect(initialReviewState([]).phase).toBe("summary");
  });

  it("último card leva ao resumo", () => {
    let s = initialReviewState([item("a")]);
    s = reviewReducer(s, { type: "submit", rating: 3, seconds: 1, at });
    s = reviewReducer(s, { type: "next" });
    expect(s.phase).toBe("summary");
  });
});

describe("fila da sessão", () => {
  const now = new Date("2026-11-22T15:00:00Z");
  const reviewed = (id: string, days: number) =>
    item(id, {
      state: 2,
      stability: 5,
      lastReview: new Date(now.getTime() - 10 * 86_400_000),
      due: new Date(now.getTime() - days * 86_400_000),
    });

  it("respeita a capacidade do tempo escolhido", () => {
    const many = Array.from({ length: 100 }, (_, i) => reviewed(`r${String(i).padStart(3, "0")}`, 0));
    expect(buildQueue(many, now, 1, "UTC")).toHaveLength(4);
  });

  it("não traz cards novos enquanto houver atrasados", () => {
    const q = buildQueue([reviewed("old", 3), item("fresh")], now, 10, "UTC");
    expect(q.map((c) => c.card.id)).toEqual(["old"]);
  });

  it("traz novos quando não há dívida", () => {
    const q = buildQueue([reviewed("today", 0), item("fresh")], now, 10, "UTC");
    expect(q.map((c) => c.card.id)).toEqual(["today", "fresh"]);
  });
});
