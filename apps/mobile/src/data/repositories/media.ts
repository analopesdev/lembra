import type { Media } from "@/domain/media/media";

export interface MediaRepository {
  get(id: string): Promise<Media | null>;
  save(value: Media): Promise<void>;
  markUploaded(id: string, at: Date): Promise<void>;
  listPending(limit: number): Promise<Media[]>;
}
