import { asc, eq, isNull } from "drizzle-orm";

import type { Media } from "@/domain/media/media";

import type { AppDb } from "../db/client";
import { media } from "../db/schema";
import type { MediaRepository } from "./media";

const toMedia = (r: typeof media.$inferSelect): Media => ({
  id: r.id,
  kind: r.kind,
  mime: r.mime,
  localPath: r.localPath,
  byteSize: r.byteSize,
  uploadedAt: r.uploadedAt,
  createdAt: r.createdAt,
});

export class SqliteMediaRepository implements MediaRepository {
  constructor(private readonly db: AppDb) {}

  async get(id: string): Promise<Media | null> {
    const rows = await this.db.select().from(media).where(eq(media.id, id)).limit(1);
    return rows[0] ? toMedia(rows[0]) : null;
  }

  async save(value: Media): Promise<void> {
    await this.db
      .insert(media)
      .values({
        id: value.id,
        kind: value.kind,
        mime: value.mime,
        localPath: value.localPath,
        byteSize: value.byteSize,
        uploadedAt: value.uploadedAt,
        createdAt: value.createdAt,
      })
      .onConflictDoUpdate({
        target: media.id,
        set: {
          kind: value.kind,
          mime: value.mime,
          localPath: value.localPath,
          byteSize: value.byteSize,
          uploadedAt: value.uploadedAt,
        },
      });
  }

  async markUploaded(id: string, at: Date): Promise<void> {
    await this.db.update(media).set({ uploadedAt: at }).where(eq(media.id, id));
  }

  async listPending(limit: number): Promise<Media[]> {
    const rows = await this.db
      .select()
      .from(media)
      .where(isNull(media.uploadedAt))
      .orderBy(asc(media.createdAt))
      .limit(limit);
    return rows.map(toMedia);
  }
}
