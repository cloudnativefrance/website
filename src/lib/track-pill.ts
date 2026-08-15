import { contrastRatio, type Rgb } from "./color-contrast";

/** sRGB gamma (EOTF): gamma-encoded 0..1 channel -> linear-light 0..1 channel. */
function decodeSrgbChannel(c: number): number {
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * #rrggbb -> linear-light Rgb in 0..1, or null when the value is not a plain
 * hex colour.
 *
 * `contrastRatio`'s luminance formula (see color-contrast.ts) does not itself
 * gamma-decode — it expects linear-light input, which is what `parseOklch`
 * already hands it via `oklchToLinearSrgb`. A hex colour is gamma-encoded
 * sRGB, so it must go through the same sRGB EOTF here or contrast ratios
 * silently come out wrong (mid-tones such as #547c86 undershoot AA).
 */
export function parseHex(value: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [
    decodeSrgbChannel(((n >> 16) & 255) / 255),
    decodeSrgbChannel(((n >> 8) & 255) / 255),
    decodeSrgbChannel((n & 255) / 255),
  ] as Rgb;
}

const DARK: string = "#1a1a1a";
const LIGHT: string = "#ffffff";

/**
 * Readable text colour for a track pill filled with `hex`.
 *
 * Track colours are chosen by organisers in Pretalx for a dark admin UI, so
 * several are light enough that white text on them fails AA badly — #edbb45
 * lands near 1.9:1. Rather than hardcode a foreground, pick whichever of black
 * or white actually contrasts, and default to dark when the value is unusable.
 */
export function pillForeground(hex: string | undefined): string {
  if (!hex) return DARK;
  const bg = parseHex(hex);
  if (!bg) return DARK;
  const dark = parseHex(DARK)!;
  const light = parseHex(LIGHT)!;
  return contrastRatio(bg, dark) >= contrastRatio(bg, light) ? DARK : LIGHT;
}
