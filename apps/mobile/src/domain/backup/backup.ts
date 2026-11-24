import { z } from "zod";

export const BACKUP_FORMAT = "lembra-backup";
export const BACKUP_VERSION = 1;

const iso = z.string().datetime({ offset: true });
const id = z.string().min(1);

const collection = z.object({
  id,
  name: z.string(),
  icon: z.enum(["bone", "heart", "flask", "help", "chart", "copy"]),
  tone: z.enum(["tint", "collection2", "collection3"]),
  examDay: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  createdAt: iso,
  updatedAt: iso,
});

const card = z.object({
  id,
  collectionId: id,
  front: z.string(),
  back: z.string(),
  tags: z.array(z.string()),
  importance: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  status: z.enum(["draft", "active", "suspended", "problematic"]),
  createdAt: iso,
  updatedAt: iso,
});

const review = z.object({
  id,
  cardId: id,
  at: iso,
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  retention: z.number().min(0).max(1).nullable(),
  kind: z.enum(["review", "in_session_retry"]),
});

const settings = z.object({
  dailyMinutes: z.number().int(),
  newCardsPerDay: z.number().int(),
  theme: z.enum(["auto", "light", "dark"]),
  offWeekdays: z.array(z.number().int().min(1).max(7)),
  goalText: z.string(),
  updatedAt: iso,
});

const file = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.number().int().min(1),
  exportedAt: iso,
  settings: settings.nullable(),
  collections: z.array(collection),
  cards: z.array(card),
  reviews: z.array(review),
});

export type BackupFile = z.infer<typeof file>;
export type BackupCard = z.infer<typeof card>;
export type BackupCollection = z.infer<typeof collection>;
export type BackupReview = z.infer<typeof review>;
export type BackupSettings = z.infer<typeof settings>;

export type BackupError = "not_json" | "wrong_format" | "newer_version" | "invalid" | "broken_reference";
export type ParseResult = { ok: true; file: BackupFile } | { ok: false; error: BackupError; detail?: string };

export function serializeBackup(data: BackupFile): string {
  return JSON.stringify(data);
}

export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "not_json" };
  }
  const head = z.object({ format: z.string(), version: z.number() }).safeParse(raw);
  if (!head.success || head.data.format !== BACKUP_FORMAT) return { ok: false, error: "wrong_format" };
  if (head.data.version > BACKUP_VERSION) return { ok: false, error: "newer_version" };
  const parsed = file.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid", detail: parsed.error.issues[0]?.path.join(".") };
  const data = parsed.data;
  const collections = new Set(data.collections.map((c) => c.id));
  const cards = new Set(data.cards.map((c) => c.id));
  if (data.cards.some((c) => !collections.has(c.collectionId)))
    return { ok: false, error: "broken_reference", detail: "cards.collectionId" };
  if (data.reviews.some((r) => !cards.has(r.cardId)))
    return { ok: false, error: "broken_reference", detail: "reviews.cardId" };
  return { ok: true, file: data };
}

const CSV_HEADER = ["colecao", "frente", "verso", "tags", "importancia", "status"] as const;

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function cardsToCsv(cards: readonly BackupCard[], collections: readonly BackupCollection[]): string {
  const names = new Map(collections.map((c) => [c.id, c.name]));
  const rows = cards.map((c) =>
    [names.get(c.collectionId) ?? "", c.front, c.back, c.tags.join(";"), String(c.importance), c.status]
      .map(csvCell)
      .join(","),
  );
  return [CSV_HEADER.join(","), ...rows].join("\r\n") + "\r\n";
}
