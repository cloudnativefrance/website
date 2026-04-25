/**
 * Asserts the 2026 edition section renders on `/` (FR) and `/en/` (EN)
 * with anchor + iframe + main mount.
 *
 * Reads built `dist/` HTML produced by `pnpm build`. Skips if dist is missing.
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

      it.skipIf(!distExists)("renders YouTube facade with EDITION_2026.youtubeId", () => {
        const html = readFileSync(path, "utf8");
        // The aftermovie uses a click-to-play facade — iframe is injected on
        // interaction, not in static HTML. The data-video-id attribute is the
        // reliable SSR signal that the facade is present.
        expect(html).toMatch(/data-video-id="qyMGuU2-w8o"/);
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
