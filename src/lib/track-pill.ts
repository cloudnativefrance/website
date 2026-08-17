import { contrastRatio, type Rgb } from "./color-contrast";

/** sRGB gamma (EOTF): gamma-encoded 0..1 channel -> linear-light 0..1 channel. */
function decodeSrgbChannel(c: number): number {
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** The one definition of "valid track colour" — shared by `parseHex` (which
 *  needs the channels) and `pillColors` (which needs a normalised string),
 *  so the two can never disagree about which inputs are usable. */
const HEX_RE = /^#?([0-9a-f]{6})$/i;

/**
 * #rrggbb -> linear-light Rgb in 0..1, or null when the value is not a plain
 * 6-digit hex colour.
 *
 * `contrastRatio`'s luminance formula (see color-contrast.ts) does not itself
 * gamma-decode — it expects linear-light input, which is what `parseOklch`
 * already hands it via `oklchToLinearSrgb`. A hex colour is gamma-encoded
 * sRGB, so it must go through the same sRGB EOTF here or contrast ratios
 * silently come out wrong (mid-tones such as #547c86 undershoot AA).
 */
export function parseHex(value: string): Rgb | null {
  const m = HEX_RE.exec(value.trim());
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

/** Fallback pair for unparseable track colours. `--color-muted` and
 *  `--color-muted-foreground` are already authored as a matched pair in the
 *  design system, so — unlike a track colour — no per-value contrast check
 *  is needed: the foreground is readable against *this specific* background
 *  because that is what the token pair is for. */
const FALLBACK_BACKGROUND = "var(--color-muted)";
const FALLBACK_FOREGROUND = "var(--color-muted-foreground)";

export interface PillColors {
  /** A CSS colour, always safe to inline. */
  background: string;
  foreground: string;
}

/**
 * Background + foreground for a track pill, decided from a single parse of
 * `hex` so the two judgements can never land on different colours.
 *
 * Track colours are chosen by organisers in Pretalx's free-text colour
 * field, so `hex` may be empty, a 3-digit shorthand, a CSS colour name, or a
 * malformed hex — not just a valid 6-digit one. When it parses, the pill is
 * filled with the (normalised) hex and the foreground is whichever of black
 * or white actually contrasts against it — several Pretalx colours are light
 * enough that white text fails AA badly, e.g. #edbb45 at ~1.9:1. When it
 * does not parse, the pill falls back to the `--color-muted` design token
 * instead of the raw (invalid) input, paired with the foreground that token
 * was designed to be read against — never a foreground chosen for a
 * background that was never actually applied.
 */
export function pillColors(hex: string | undefined): PillColors {
  const match = hex ? HEX_RE.exec(hex.trim()) : null;
  if (!match) {
    return { background: FALLBACK_BACKGROUND, foreground: FALLBACK_FOREGROUND };
  }

  const bg = parseHex(hex!)!;
  const dark = parseHex(DARK)!;
  const light = parseHex(LIGHT)!;
  const foreground = contrastRatio(bg, dark) >= contrastRatio(bg, light) ? DARK : LIGHT;

  return { background: `#${match[1].toLowerCase()}`, foreground };
}
