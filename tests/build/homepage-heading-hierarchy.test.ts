/**
 * Phase 17 SC3 / D-11: assert homepage heading hierarchy is valid.
 *
 * Both `/` (FR) and `/en/` (EN) must have:
 *  - exactly one <h1>
 *  - no skipped heading levels (h1 → h2, no h3 before h2, etc.)
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DIST_FR = resolve(import.meta.dirname, "../../dist/index.html");
const DIST_EN = resolve(import.meta.dirname, "../../dist/en/index.html");
const distExists = existsSync(DIST_FR) && existsSync(DIST_EN);

function extractHeadingLevels(html: string): number[] {
  const levels: number[] = [];
  const re = /<h([1-6])\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    levels.push(Number(m[1]));
  }
  return levels;
}

const pages: Array<{ label: string; path: string }> = [
  { label: "FR (/)", path: DIST_FR },
  { label: "EN (/en/)", path: DIST_EN },
];

describe("SC3 / D-11: homepage heading hierarchy", () => {
  for (const { label, path } of pages) {
    describe(label, () => {
      it.skipIf(!distExists)("contains exactly one <h1>", () => {
        const html = readFileSync(path, "utf8");
        const h1s = html.match(/<h1\b/gi) ?? [];
        expect(h1s.length, `Expected 1 h1, found ${h1s.length}`).toBe(1);
      });

      it.skipIf(!distExists)("no skipped heading levels (step size ≤ 1 when going deeper)", () => {
        const html = readFileSync(path, "utf8");
        const levels = extractHeadingLevels(html);
        expect(levels.length).toBeGreaterThan(0);
        let maxSoFar = 0;
        const skips: Array<{ at: number; from: number; to: number }> = [];
        levels.forEach((lvl, i) => {
          if (lvl > maxSoFar + 1) {
            skips.push({ at: i, from: maxSoFar, to: lvl });
          }
          maxSoFar = Math.max(maxSoFar, lvl);
        });
        expect(
          skips,
          `Skipped heading levels: ${skips.map((s) => `h${s.from}→h${s.to} at #${s.at}`).join(", ")}`,
        ).toEqual([]);
      });
    });
  }
});
