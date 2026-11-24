import { BACKUP_FORMAT, BACKUP_VERSION, type BackupFile } from "@/domain/backup/backup";
import {
  normalizeMinutes,
  normalizeNewCards,
  normalizeTheme,
  normalizeWeekdays,
} from "@/domain/settings/settings";
import type { Card, Collection } from "@/domain/types";

import type { CardsRepository, ReviewRecord } from "./repositories/cards";
import type { CollectionsRepository } from "./repositories/collections";
import type { SettingsRepository } from "./repositories/settings";

export interface BackupDeps {
  readonly cards: CardsRepository;
  readonly collections: CollectionsRepository;
  readonly settings: SettingsRepository;
  readonly now: () => Date;
}

export interface RestoreSummary {
  readonly collections: number;
  readonly cards: number;
  readonly reviews: number;
  readonly settings: boolean;
}

const BATCH = 500;
const iso = (d: Date) => d.toISOString();

export async function createBackup(d: BackupDeps): Promise<BackupFile> {
  const [collections, cards, reviews, settings] = await Promise.all([
    d.collections.listAll(),
    d.cards.listAll(),
    d.cards.listAllReviews(),
    d.settings.get(),
  ]);
  const cardIds = new Set(cards.map((c) => c.id));
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: iso(d.now()),
    settings: settings
      ? {
          dailyMinutes: settings.dailyMinutes,
          newCardsPerDay: settings.newCardsPerDay,
          theme: settings.theme,
          avatarSeed: settings.avatarSeed,
          glassNav: settings.glassNav,
          offWeekdays: [...settings.offWeekdays],
          goalText: settings.goalText,
          updatedAt: iso(settings.updatedAt),
        }
      : null,
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      tone: c.tone,
      examDay: c.examDay,
      createdAt: iso(c.createdAt),
      updatedAt: iso(c.updatedAt),
    })),
    cards: cards.map((c) => ({
      id: c.id,
      collectionId: c.collectionId,
      front: c.front,
      back: c.back,
      frontDoc: c.frontDoc,
      backDoc: c.backDoc,
      kind: c.kind,
      direction: c.direction,
      pairId: c.pairId,
      tags: [...c.tags],
      importance: c.importance,
      status: c.status,
      createdAt: iso(c.createdAt),
      updatedAt: iso(c.updatedAt),
    })),
    reviews: reviews
      .filter((r) => cardIds.has(r.cardId))
      .sort((a, b) => a.at.getTime() - b.at.getTime() || (a.id < b.id ? -1 : 1))
      .map((r) => ({
        id: r.id,
        cardId: r.cardId,
        at: iso(r.at),
        rating: r.rating,
        retention: r.retention,
        kind: r.kind,
      })),
  };
}

export async function restoreBackup(d: BackupDeps, file: BackupFile): Promise<RestoreSummary> {
  const localCollections = new Map((await d.collections.listAll()).map((c) => [c.id, c]));
  let collections = 0;
  for (const c of file.collections) {
    const incoming: Collection = {
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      deletedAt: null,
    };
    const local = localCollections.get(c.id);
    if (local && local.updatedAt.getTime() >= incoming.updatedAt.getTime()) continue;
    await d.collections.save(incoming);
    collections++;
  }

  const localCards = new Map((await d.cards.listAll()).map((c) => [c.id, c]));
  const newer: Card[] = [];
  for (const c of file.cards) {
    const incoming: Card = {
      ...c,
      frontDoc: c.frontDoc ?? null,
      backDoc: c.backDoc ?? null,
      kind: c.kind ?? "basic",
      direction: c.direction ?? "forward",
      pairId: c.pairId ?? null,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      deletedAt: null,
    };
    const local = localCards.get(c.id);
    if (local && local.updatedAt.getTime() >= incoming.updatedAt.getTime()) continue;
    newer.push(incoming);
  }
  for (let i = 0; i < newer.length; i += BATCH) await d.cards.saveMany(newer.slice(i, i + BATCH));

  const records: ReviewRecord[] = file.reviews.map((r) => ({
    id: r.id,
    cardId: r.cardId,
    at: new Date(r.at),
    rating: r.rating,
    retention: r.retention,
    kind: r.kind,
  }));
  const reviews = await d.cards.importReviews(records);

  let settingsApplied = false;
  if (file.settings) {
    const local = await d.settings.get();
    const incomingAt = new Date(file.settings.updatedAt);
    if (!local || local.updatedAt.getTime() < incomingAt.getTime()) {
      await d.settings.save({
        dailyMinutes: normalizeMinutes(file.settings.dailyMinutes),
        newCardsPerDay: normalizeNewCards(file.settings.newCardsPerDay),
        theme: normalizeTheme(file.settings.theme),
        avatarSeed: file.settings.avatarSeed ?? "",
        glassNav: file.settings.glassNav ?? false,
        offWeekdays: normalizeWeekdays(file.settings.offWeekdays),
        goalText: file.settings.goalText,
        updatedAt: incomingAt,
      });
      settingsApplied = true;
    }
  }

  if (reviews > 0 || newer.length > 0) await d.cards.rebuildStates();
  return { collections, cards: newer.length, reviews, settings: settingsApplied };
}
