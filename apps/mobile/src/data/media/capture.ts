import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { SaveFormat, manipulateAsync } from "expo-image-manipulator";

import {
  AUDIO_BITRATE_KBPS,
  AUDIO_SAMPLE_RATE,
  IMAGE_MAX_EDGE,
  IMAGE_QUALITY,
  MEDIA_MAX_BYTES,
  fitMaxEdge,
  isCompactAudio,
  type MediaKind,
} from "@/domain/media/media";
import { downsampleMono, parseWav } from "@/domain/media/wav";

import { encodeMp3 } from "./mp3";

export type Captured = {
  readonly uri: string;
  readonly mime: string;
  readonly kind: MediaKind;
  readonly ext: string;
};

async function writeTemp(name: string, bytes: Uint8Array): Promise<string> {
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(bytes);
  return file.uri;
}

async function compressImage(uri: string, width?: number, height?: number): Promise<Captured> {
  const fit =
    width && height
      ? fitMaxEdge(width, height, IMAGE_MAX_EDGE)
      : { width: IMAGE_MAX_EDGE, height: IMAGE_MAX_EDGE };
  const actions = fit ? [{ resize: fit }] : [];
  try {
    const webp = await manipulateAsync(uri, actions, { compress: IMAGE_QUALITY, format: SaveFormat.WEBP });
    return { uri: webp.uri, mime: "image/webp", kind: "image", ext: "webp" };
  } catch {
    const jpeg = await manipulateAsync(uri, actions, { compress: IMAGE_QUALITY, format: SaveFormat.JPEG });
    return { uri: jpeg.uri, mime: "image/jpeg", kind: "image", ext: "jpg" };
  }
}

async function compressAudio(uri: string, mime: string, size?: number): Promise<Captured | null> {
  if (size && size > MEDIA_MAX_BYTES) return null;
  if (isCompactAudio(mime)) {
    const ext = mime.includes("webm") ? "webm" : mime.includes("mp4") || mime.includes("aac") ? "m4a" : "mp3";
    return { uri, mime, kind: "audio", ext };
  }
  const wav = parseWav(await new File(uri).arrayBuffer());
  if (!wav) return size && size > MEDIA_MAX_BYTES ? null : { uri, mime, kind: "audio", ext: "wav" };
  const mono = downsampleMono(wav, AUDIO_SAMPLE_RATE);
  const mp3 = encodeMp3(mono, AUDIO_SAMPLE_RATE, AUDIO_BITRATE_KBPS);
  if (mp3.byteLength === 0 || mp3.byteLength > MEDIA_MAX_BYTES) return null;
  const out = await writeTemp(`audio-${Date.now()}.mp3`, mp3);
  return { uri: out, mime: "audio/mpeg", kind: "audio", ext: "mp3" };
}

export async function pickImage(): Promise<Captured | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;
  return compressImage(asset.uri, asset.width, asset.height);
}

export async function pickAudio(): Promise<Captured | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["audio/*"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;
  return compressAudio(asset.uri, asset.mimeType ?? "audio/mpeg", asset.size);
}
