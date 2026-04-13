/**
 * Phase 17 EDIT-01 guard: asserts the 2026 edition section renders on both
 * `/` (FR) and `/en/` (EN) with all required pieces per SC1, SC2, SC4, D-09.
 *
 * Reads committed `dist/` HTML produced by `pnpm build`. Skips if dist is
 * missing so the test file can land before the mount commit without blocking.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DIST_FR = resolve(import.meta.dirname, "../../dist/index.html");
const DIST_EN = resolve(import.meta.dirname, "../../dist/en/index.html");
const distExists = existsSync(DIST_FR) && existsSync(DIST_EN);

const pages: Array<{ label: string; path: string }> = [
  { label: "FR (/)", path: DIST_FR },
  { label: "EN (/en/)", path: DIST_EN },
];

describe("EDIT-01 / EDIT-06 / SC1-4: 2026 edition section on homepage", () => {
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

      it.skipIf(!distExists)("renders the 2023 playlist video embed alongside 2026", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/videoseries\?list=PLmZ3gFl2Aqt_Qo4EAITE1ewy1ww5jkU2h/);
      });

      it.skipIf(!distExists)("places 2026 section AFTER the CFP section and BEFORE 2023 section (SC1 / EDIT-06)", () => {
        const html = readFileSync(path, "utf8");
        // Locale-agnostic CFP marker: the CFP section's id anchor
        const cfpIdx = html.indexOf('id="cfp"');
        const section2026 = html.indexOf('id="edition-2026"');
        const section2023 = html.indexOf('id="edition-2023"');
        expect(cfpIdx, "CFP anchor not found").toBeGreaterThan(-1);
        expect(section2026, "#edition-2026 not found").toBeGreaterThan(cfpIdx);
        expect(section2023, "#edition-2023 not found").toBeGreaterThan(section2026);
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
