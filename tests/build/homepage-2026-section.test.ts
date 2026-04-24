/**
 * Phase 17 EDIT-01 / EDIT-07 guard, retargeted in Phase 26 for the v1.2 homepage,
 * pruned again on `feat/light-dark-mode` after the homepage rework:
 *   - Testimonials section was removed entirely.
 *   - Edition 2023 photo block + Edition2023Link pointer were removed from the homepage.
 *   - CFP section was removed from the homepage.
 *   - Edition 2026 was reworked: heading copy changed, PDF CTA removed, 3-link CTA row
 *     became 2 outlined buttons (replays + gallery), no rail label.
 *
 * What this file still asserts:
 *   - 2026 edition section renders on `/` (FR) and `/en/` (EN) with anchor + iframe + main mount.
 *
 * Reads committed `dist/` HTML produced by `bun run build`. Skips if dist is missing.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DIST_FR = resolve(import.meta.dirname, "../../dist/index.html");
const DIST_EN = resolve(import.meta.dirname, "../../dist/en/index.html");
const distExists = existsSync(DIST_FR) && existsSync(DIST_EN);

const pages: Array<{ label: string; path: string; locale: "fr" | "en" }> = [
  { label: "FR (/)", path: DIST_FR, locale: "fr" },
  { label: "EN (/en/)", path: DIST_EN, locale: "en" },
];

describe("EDIT-01 / EDIT-06: 2026 edition section on homepage", () => {
  for (const { label, path } of pages) {
    describe(label, () => {
      it.skipIf(!distExists)("contains id=\"edition-2026\" anchor", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/id="edition-2026"/);
      });

      it.skipIf(!distExists)("renders youtube-nocookie iframe with EDITION_2026.youtubeId", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/youtube-nocookie\.com\/embed\/qyMGuU2-w8o/);
      });

      it.skipIf(!distExists)("mounts within main landmark", () => {
        const html = readFileSync(path, "utf8");
        const mainStart = html.indexOf("<main");
        const mainEnd = html.indexOf("</main>");
        const sectionIdx = html.indexOf('id="edition-2026"');
        expect(sectionIdx).toBeGreaterThan(mainStart);
        expect(sectionIdx).toBeLessThan(mainEnd);
      });
    });
  }
});
