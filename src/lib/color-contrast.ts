/**
 * WCAG contrast maths for the OKLCH design tokens in `src/styles/global.css`.
 *
 * The palette is authored in OKLCH, but WCAG 2.x contrast is defined on sRGB
 * relative luminance, so a token pair cannot be judged by its lightness
 * channel alone: at the same L, a saturated red carries far less luminance
 * than a desaturated blue. `--destructive` at L=54% reads as comfortable on
 * the light surfaces and as 2.8:1 mud on the dark ones for exactly that
 * reason. These helpers exist so that relationship is asserted in a test
 * rather than eyeballed in a browser.
 */

export type Rgb = readonly [number, number, number];

/** Linear-light sRGB from OKLCH. Channels may fall outside [0,1] when the
 *  requested chroma is beyond the sRGB gamut — see `isInSrgbGamut`. */
function oklchToLinearSrgb(l: number, c: number, hDeg: number): Rgb {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);

  const lms = [
    (l + 0.3963377774 * a + 0.2158037573 * b) ** 3,
    (l - 0.1055613458 * a - 0.0638541728 * b) ** 3,
    (l - 0.0894841775 * a - 1.291485548 * b) ** 3,
  ] as const;
  const [long, medium, short] = lms;

  return [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ];
}

/** True when the colour survives sRGB clipping, i.e. what the browser paints
 *  is the colour that was asked for. */
export function isInSrgbGamut(l: number, c: number, hDeg: number): boolean {
  return oklchToLinearSrgb(l, c, hDeg).every((v) => v >= -0.0005 && v <= 1.0005);
}

function relativeLuminance([r, g, b]: Rgb): number {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return 0.2126 * clamp(r) + 0.7152 * clamp(g) + 0.0722 * clamp(b);
}

/** `oklch(54.0% 0.216 25.2)` → linear sRGB. Alpha is not supported: every
 *  token asserted by the contrast test is opaque. */
export function parseOklch(value: string): Rgb {
  const match = value
    .trim()
    .match(/^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)$/);
  if (!match) throw new Error(`Not an opaque oklch() colour: ${value}`);
  const [, l, c, h] = match;
  return oklchToLinearSrgb(Number(l) / 100, Number(c), Number(h));
}

/** WCAG 2.x contrast ratio, 1–21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x
  );
  return (hi + 0.05) / (lo + 0.05);
}

/** Extract the custom properties declared in one CSS rule block.
 *  Deliberately naive — it reads our own hand-written token file, not
 *  arbitrary CSS. */
export function readTokenBlock(
  css: string,
  selector: string
): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No \`${selector}\` block in stylesheet`);
  const body = css.slice(start, css.indexOf("\n}", start));

  const tokens: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(
    /^\s*(--[\w-]+):\s*([^;]+);/gm
  )) {
    tokens[name] = value.trim();
  }
  return tokens;
}
