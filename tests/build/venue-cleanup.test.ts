/**
 * Phase 18-01 regression guard: after the "Previous edition 2026" block was
 * deleted from both venue pages (FR + EN), assert that:
 *
 *   (a) Source files contain none of the 8 orphaned symbols that used to power
 *       the block (EDITION_2026 import, ambiance03/06/10 imports, YOUTUBE_ID,
 *       GALLERY_URL, previousStats, thumbnails locals).
 *   (b) Rendered `dist/venue/index.html` and `dist/en/venue/index.html` contain
 *       no fragment of the deleted block (stat value "1700+", youtube-nocookie
 *       iframe src, youtube.com/embed URL, "CND France 2026" rail copy).
 *
 * Source-level checks always run. Dist-level checks skip when `dist/` is absent
 * (mirrors the pattern used in `tests/build/homepage-2026-section.test.ts`).
 *
 * See `.planning/phases/18-venue-page-cleanup/18-CONTEXT.md` decisions D-01..D-05.
 *
 * TODO(18-02): assert grep venue.prev src/i18n/ui.ts -> 0 matches once the
 * i18n sweep commit lands.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");

const SRC_FR = resolve(ROOT, "src/pages/venue/index.astro");
const SRC_EN = resolve(ROOT, "src/pages/en/venue/index.astro");
const DIST_FR = resolve(ROOT, "dist/venue/index.html");
const DIST_EN = resolve(ROOT, "dist/en/venue/index.html");

const distExists = existsSync(DIST_FR) && existsSync(DIST_EN);

const ORPHAN_RE = /EDITION_2026|ambiance0(3|6)|ambiance10|YOUTUBE_ID|GALLERY_URL|previousStats|thumbnails/;

const DIST_FRAGMENTS: Array<{ label: string; pattern: RegExp }> = [
  { label: "stat value '1700+'", pattern: /1700\+/ },
  { label: "youtube-nocookie iframe host", pattern: /youtube-nocookie/ },
  { label: "youtube.com/embed URL", pattern: /youtube\.com\/embed/ },
  { label: "'CND France 2026' rail copy", pattern: /CND France 2026/ },
];

const sources: Array<{ label: string; path: string }> = [
  { label: "FR src/pages/venue/index.astro", path: SRC_FR },
  { label: "EN src/pages/en/venue/index.astro", path: SRC_EN },
];

const dists: Array<{ label: string; path: string }> = [
  { label: "FR dist/venue/index.html", path: DIST_FR },
  { label: "EN dist/en/venue/index.html", path: DIST_EN },
];

describe("18-01 / SC2: venue source is free of orphaned previous-edition symbols", () => {
  for (const { label, path } of sources) {
    it(`${label} contains none of: EDITION_2026, ambiance03/06/10, YOUTUBE_ID, GALLERY_URL, previousStats, thumbnails`, () => {
      const src = readFileSync(path, "utf8");
      const match = src.match(ORPHAN_RE);
      expect(
        match,
        match ? `Unexpected orphan symbol '${match[0]}' in ${label}` : undefined,
      ).toBeNull();
    });
  }
});

describe("18-01 / SC5: rendered venue is free of the previous-edition block", () => {
  for (const { label, path } of dists) {
    describe(label, () => {
      for (const { label: fragLabel, pattern } of DIST_FRAGMENTS) {
        it.skipIf(!distExists)(`does not contain ${fragLabel}`, () => {
          const html = readFileSync(path, "utf8");
          expect(html).not.toMatch(pattern);
        });
      }
    });
  }
});
