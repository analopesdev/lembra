// SPIKE (ADR-0010): popula 10 mil cards com estados variados para medir a tela Hoje.
// Código descartável: remover quando a decisão do spike for tomada.
import { sql } from "drizzle-orm";

import type { AppDb } from "@/data/db/client";
import { cardStates } from "@/data/db/schema";
import type { SqliteCardsRepository } from "@/data/repositories/cards.sqlite";
import type { Card } from "@/domain/types";

export function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export async function seedCards(repo: SqliteCardsRepository, db: AppDb, n: number, now: Date) {
  const rnd = lcg(42);
  const DAY = 86_400_000;
  const all: Card[] = [];
  for (let i = 0; i < n; i++) {
    all.push({
      id: `0190${String(i).padStart(4, "0")}-0000-7000-8000-${String(i).padStart(12, "0")}`,
      collectionId: `col-${i % 12}`,
      front: `Pergunta ${i}: qual é o conceito número ${i} e por que ele importa no contexto?`,
      back: `Resposta ${i}: explicação curta do conceito ${i}.`,
      tags: ["tag" + (i % 7), "tema" + (i % 13)],
      importance: ((i % 3) + 1) as 1 | 2 | 3,
      status: i % 50 === 0 ? "suspended" : "active",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }
  const t0 = performance.now();
  for (let i = 0; i < all.length; i += 2000) await repo.saveMany(all.slice(i, i + 2000));
  const cardsMs = performance.now() - t0;

  // Estados "vividos": vencimentos de -30 a +90 dias e estabilidades variadas (substitui o estado inicial).
  const t1 = performance.now();
  for (let i = 0; i < all.length; i += 100) {
    const part = all.slice(i, i + 100);
    const rows = part.map((c) => {
      const stability = 1 + rnd() * 60;
      const lastDaysAgo = rnd() * 40;
      const due = now.getTime() + (rnd() * 120 - 30) * DAY;
      return {
        cardId: c.id,
        due: new Date(due),
        stability,
        difficulty: 1 + rnd() * 9,
        state: 2 as const,
        reps: 3,
        lapses: 0,
        scheduledDays: Math.round(stability),
        lastReview: new Date(now.getTime() - lastDaysAgo * DAY),
        isActive: c.status === "active" ? 1 : 0,
        importance: c.importance,
        retainedUntil: new Date(now.getTime() - lastDaysAgo * DAY + stability * DAY),
      };
    });
    await db
      .insert(cardStates)
      .values(rows)
      .onConflictDoUpdate({
        target: cardStates.cardId,
        set: {
          due: sql.raw("excluded.due"),
          stability: sql.raw("excluded.stability"),
          difficulty: sql.raw("excluded.difficulty"),
          state: sql.raw("excluded.state"),
          reps: sql.raw("excluded.reps"),
          scheduledDays: sql.raw("excluded.scheduled_days"),
          lastReview: sql.raw("excluded.last_review"),
          isActive: sql.raw("excluded.is_active"),
          importance: sql.raw("excluded.importance"),
          retainedUntil: sql.raw("excluded.retained_until"),
        },
      });
  }
  return { cardsMs, statesMs: performance.now() - t1 };
}
