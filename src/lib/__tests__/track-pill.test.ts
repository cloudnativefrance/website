import { describe, it, expect } from "vitest";
import { pillForeground } from "../track-pill";

describe("pillForeground", () => {
  it("puts dark text on a light track colour", () => {
    // Pretalx's "Infrastructure et opérations" is #edbb45. White text on it is
    // about 1.9:1 — unreadable — so the pill must flip to dark.
    expect(pillForeground("#edbb45")).toBe("#1a1a1a");
  });

  it("puts light text on a dark track colour", () => {
    expect(pillForeground("#20134d")).toBe("#ffffff");
  });

  it("falls back to dark text on an unparseable value", () => {
    expect(pillForeground("not-a-colour")).toBe("#1a1a1a");
    expect(pillForeground(undefined)).toBe("#1a1a1a");
  });

  it("always clears AA for normal text against its own background", () => {
    for (const hex of ["#edbb45", "#31adcc", "#547c86", "#eb7a95", "#7172f6"]) {
      expect(contrastOf(hex, pillForeground(hex))).toBeGreaterThanOrEqual(4.5);
    }
  });
});

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
