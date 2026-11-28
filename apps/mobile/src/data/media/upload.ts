import Constants from "expo-constants";
import { File } from "expo-file-system";

import type { Media } from "@/domain/media/media";

import type { MediaRepository } from "../repositories/media";

const API_PORT = 8080;

export function apiBaseUrl(
  env: string | undefined = process.env.EXPO_PUBLIC_LEMBRA_API_URL,
  hostUri: string | undefined = Constants.expoConfig?.hostUri,
  webHost: string | undefined = typeof window !== "undefined" ? window.location?.hostname : undefined,
): string {
  if (env) return env.replace(/\/+$/, "");
  const devHost = hostUri?.split(":")[0];
  const host = webHost || devHost || "127.0.0.1";
  return `http://${host}:${API_PORT}`;
}

export async function uploadIfPossible(repo: MediaRepository, item: Media): Promise<boolean> {
  if (item.uploadedAt) return true;
  try {
    const created = await fetch(`${apiBaseUrl()}/v1/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        kind: item.kind,
        contentType: item.mime,
        byteSize: item.byteSize,
      }),
    });
    if (!created.ok) return false;
    const body = (await created.json()) as { uploadUrl: string };
    const bytes = await new File(item.localPath).arrayBuffer();
    const put = await fetch(body.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": item.mime },
      body: bytes,
    });
    if (!put.ok) return false;
    await repo.markUploaded(item.id, new Date());
    return true;
  } catch {
    return false;
  }
}

let running = false;

export async function uploadPending(repo: MediaRepository, limit = 20): Promise<number> {
  if (running) return 0;
  running = true;
  try {
    let sent = 0;
    for (const item of await repo.listPending(limit)) {
      if (!(await uploadIfPossible(repo, item))) break;
      sent++;
    }
    return sent;
  } catch {
    return 0;
  } finally {
    running = false;
  }
}
