import lamejs from "lamejs";

export function encodeMp3(samples: Int16Array, sampleRate: number, kbps: number): Uint8Array {
  const enc = new lamejs.Mp3Encoder(1, sampleRate, kbps);
  const block = 1152;
  const parts: Uint8Array[] = [];
  for (let i = 0; i < samples.length; i += block) {
    const encoded = enc.encodeBuffer(samples.subarray(i, Math.min(samples.length, i + block)));
    if (encoded.length > 0) parts.push(Uint8Array.from(encoded));
  }
  const tail = enc.flush();
  if (tail.length > 0) parts.push(Uint8Array.from(tail));
  const bytes = parts.reduce((n, p) => n + p.byteLength, 0);
  const out = new Uint8Array(bytes);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.byteLength;
  }
  return out;
}
