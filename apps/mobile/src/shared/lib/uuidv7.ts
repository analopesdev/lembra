// UUIDv7 (RFC 9562): 48 bits de timestamp em ms + aleatoriedade. Tempo e fonte de bytes aleatórios
// são injetados para tornar o gerador determinístico em testes (ADR-0009).
export type RandomBytes = (n: number) => Uint8Array;

export function uuidv7(nowMs: number, randomBytes: RandomBytes): string {
  const b = new Uint8Array(16);
  b.set(randomBytes(16).subarray(0, 16));
  const ts = Math.max(0, Math.floor(nowMs));
  // 48 bits big-endian do timestamp (evita operadores de 32 bits em valores > 2^32).
  const hi = Math.floor(ts / 0x1_0000_0000);
  const lo = ts % 0x1_0000_0000;
  b[0] = (hi >>> 8) & 0xff;
  b[1] = hi & 0xff;
  b[2] = (lo >>> 24) & 0xff;
  b[3] = (lo >>> 16) & 0xff;
  b[4] = (lo >>> 8) & 0xff;
  b[5] = lo & 0xff;
  b[6] = ((b[6] ?? 0) & 0x0f) | 0x70; // versão 7
  b[8] = ((b[8] ?? 0) & 0x3f) | 0x80; // variante RFC 4122
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Fonte padrão de aleatoriedade (Web Crypto, disponível em web, Hermes e Node ≥ 19). */
export const cryptoRandomBytes: RandomBytes = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));
