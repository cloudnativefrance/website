/**
 * A11Y-05 guard (Phase 16, D-07).
 *
 * Asserts that src/styles/global.css contains the global
 * `@media (prefers-reduced-motion: reduce)` reset block with the four
 * locked declarations AND that the block is NOT nested inside any
 * `@layer` (RESEARCH.md Pitfall 3 — layer wrapping breaks !important cascade).
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const CSS_PATH = resolve(
  import.meta.dirname,
  "../../src/styles/global.css",
);

/** Return [start, end) byte ranges of every top-level `@layer …{ … }` block. */
function findLayerRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const re = /@layer\b[^{]*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const start = m.index;
    let depth = 1;
    let i = m.index + m[0].length;
    while (i < text.length && depth > 0) {
      const ch = text[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      i++;
    }
    ranges.push([start, i]);
  }
  return ranges;
}

describe("A11Y-05: prefers-reduced-motion reset", () => {
  it("global.css exists", () => {
    expect(existsSync(CSS_PATH), `Missing ${CSS_PATH}`).toBe(true);
  });

  it("contains a @media (prefers-reduced-motion: reduce) block", () => {
    const text = readFileSync(CSS_PATH, "utf-8");
    expect(text).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
  });

  it("block contains all four locked declarations (D-07)", () => {
    const text = readFileSync(CSS_PATH, "utf-8");
    expect(text).toContain("animation-duration: 0.01ms !important");
    expect(text).toContain("animation-iteration-count: 1 !important");
    expect(text).toContain("transition-duration: 0.01ms !important");
    expect(text).toContain("scroll-behavior: auto !important");
  });

  it("block is NOT nested inside an @layer (Pitfall 3)", () => {
    const text = readFileSync(CSS_PATH, "utf-8");
    const motionIdx = text.search(
      /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/,
    );
    expect(motionIdx, "prefers-reduced-motion block not found").toBeGreaterThan(-1);
    const layerRanges = findLayerRanges(text);
    const nested = layerRanges.find(
      ([start, end]) => motionIdx >= start && motionIdx < end,
    );
    expect(
      nested,
      `prefers-reduced-motion block is nested inside @layer at bytes ${nested?.[0]}..${nested?.[1]} — must be top-level (Pitfall 3)`,
    ).toBeUndefined();
  });
});
