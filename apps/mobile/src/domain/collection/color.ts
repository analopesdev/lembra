export type Contrast = "dark" | "light";

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function contrastOf(hex: string): Contrast {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m?.[1]) return "dark";
  const n = parseInt(m[1], 16);
  const lum =
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  return lum > 0.179 ? "dark" : "light";
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}
