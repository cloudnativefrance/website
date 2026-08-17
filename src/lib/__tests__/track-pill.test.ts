import { describe, it, expect } from "vitest";
import { pillColors } from "../track-pill";

describe("pillColors", () => {
  it("puts dark text on a light track colour", () => {
    // Pretalx's "Infrastructure et opérations" is #edbb45. White text on it is
    // about 1.9:1 — unreadable — so the pill must flip to dark.
    expect(pillColors("#edbb45")).toEqual({ background: "#edbb45", foreground: "#1a1a1a" });
  });

  it("puts light text on a dark track colour", () => {
    expect(pillColors("#20134d")).toEqual({ background: "#20134d", foreground: "#ffffff" });
  });

  it("always clears AA for normal text against its own background", () => {
    for (const hex of ["#edbb45", "#31adcc", "#547c86", "#eb7a95", "#7172f6"]) {
      const { background, foreground } = pillColors(hex);
      expect(contrastOf(background, foreground)).toBeGreaterThanOrEqual(4.5);
    }
  });

  describe("unparseable input falls back to a matched design-token pair", () => {
    // Each case must produce a `background` that is a valid CSS value (so
    // the browser never silently drops the declaration) paired with a
    // `foreground` chosen for *that* background — not for the raw input.
    const FALLBACK = { background: "var(--color-muted)", foreground: "var(--color-muted-foreground)" };

    it("undefined", () => {
      expect(pillColors(undefined)).toEqual(FALLBACK);
    });

    it("empty string", () => {
      expect(pillColors("")).toEqual(FALLBACK);
    });

    it("3-digit shorthand hex", () => {
      expect(pillColors("#abc")).toEqual(FALLBACK);
    });

    it("a CSS colour name", () => {
      expect(pillColors("tomato")).toEqual(FALLBACK);
    });

    it("a malformed hex", () => {
      expect(pillColors("#zzzzzz")).toEqual(FALLBACK);
    });
  });
});

/**
 * Independently implemented WCAG contrast check, deliberately separate from
 * `color-contrast.ts` / `track-pill.ts`'s own maths. This is what caught the
 * earlier colour-space bug (contrastRatio expects linear-light input, hex is
 * gamma-encoded sRGB); reusing the production contrast function here would
 * make these assertions tautological.
 */
function contrastOf(bg: string, fg: string): number {
  const toRgb = (h: string): [number, number, number] => {
    const v = h.replace("#", "");
    return [
      parseInt(v.slice(0, 2), 16) / 255,
      parseInt(v.slice(2, 4), 16) / 255,
      parseInt(v.slice(4, 6), 16) / 255,
    ];
  };
  const lum = (c: [number, number, number]) => {
    const f = c.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  };
  const [a, b] = [lum(toRgb(bg)), lum(toRgb(fg))].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}
