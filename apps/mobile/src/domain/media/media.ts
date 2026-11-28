export type MediaKind = "image" | "audio" | "video";

export interface Media {
  readonly id: string;
  readonly kind: MediaKind;
  readonly mime: string;
  readonly localPath: string;
  readonly byteSize: number;
  readonly uploadedAt: Date | null;
  readonly createdAt: Date;
}

export const IMAGE_MAX_EDGE = 1600;
export const IMAGE_QUALITY = 0.7;
export const AUDIO_SAMPLE_RATE = 22050;
export const AUDIO_BITRATE_KBPS = 64;
export const MEDIA_MAX_BYTES = 20 * 1024 * 1024;

export function fitMaxEdge(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } | null {
  if (width <= 0 || height <= 0) return null;
  const edge = Math.max(width, height);
  if (edge <= maxEdge) return null;
  const scale = maxEdge / edge;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export function isCompactAudio(mime: string): boolean {
  const m = mime.toLowerCase();
  return m === "audio/mpeg" || m === "audio/mp4" || m === "audio/aac" || m === "audio/webm";
}
