import { AUDIO_SAMPLE_RATE } from "./media";

export type Pcm = {
  readonly sampleRate: number;
  readonly channels: number;
  readonly samples: Int16Array;
};

export function parseWav(buf: ArrayBuffer): Pcm | null {
  if (buf.byteLength < 44) return null;
  const view = new DataView(buf);
  if (view.getUint32(0, false) !== 0x52494646 || view.getUint32(8, false) !== 0x57415645) return null;
  let offset = 12;
  let channels = 0;
  let sampleRate = 0;
  let bits = 0;
  let dataOffset = 0;
  let dataBytes = 0;
  while (offset + 8 <= view.byteLength) {
    const id = view.getUint32(offset, false);
    const size = view.getUint32(offset + 4, true);
    offset += 8;
    if (id === 0x666d7420) {
      channels = view.getUint16(offset + 2, true);
      sampleRate = view.getUint32(offset + 4, true);
      bits = view.getUint16(offset + 14, true);
    } else if (id === 0x64617461) {
      dataOffset = offset;
      dataBytes = size;
      break;
    }
    offset += size + (size % 2);
  }
  if (!channels || !sampleRate || bits !== 16 || !dataBytes) return null;
  const samples = new Int16Array(buf, dataOffset, Math.floor(dataBytes / 2));
  return { sampleRate, channels, samples };
}

export function downsampleMono(pcm: Pcm, targetRate = AUDIO_SAMPLE_RATE): Int16Array {
  const srcRate = pcm.sampleRate;
  const ch = pcm.channels;
  const frames = Math.floor(pcm.samples.length / ch);
  const ratio = srcRate / targetRate;
  const outFrames = Math.max(1, Math.floor(frames / ratio));
  const out = new Int16Array(outFrames);
  for (let i = 0; i < outFrames; i++) {
    const src = Math.min(frames - 1, Math.floor(i * ratio));
    let sum = 0;
    for (let c = 0; c < ch; c++) sum += pcm.samples[src * ch + c] ?? 0;
    out[i] = Math.max(-32768, Math.min(32767, Math.round(sum / ch)));
  }
  return out;
}