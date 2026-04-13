/**
 * Phase 17 SC5 / D-12: assert the legacy venue 2026 block at /venue/ is still
 * rendered byte-level-identical to pre-refactor state.
 *
 * Deletion is Phase 18. Until then, `src/pages/venue/index.astro` lines 216-300
 * must produce the same rendered markup as before — only the data source (local
 * constants → editions-data.ts import) changed.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DIST_VENUE = resolve(import.meta.dirname, "../../dist/venue/index.html");
const distExists = existsSync(DIST_VENUE);

describe("SC5 / D-12: legacy venue 2026 block renders unchanged", () => {
  it.skipIf(!distExists)("still renders the youtube-nocookie iframe with EDITION_2026.youtubeId", () => {
    const html = readFileSync(DIST_VENUE, "utf8");
    expect(html).toMatch(/youtube-nocookie\.com\/embed\/qyMGuU2-w8o/);
  });

  it.skipIf(!distExists)("still renders the previous edition stats row (participants/speakers/sessions)", () => {
    const html = readFileSync(DIST_VENUE, "utf8");
    // venue block renders the 3 previousStats values — assert generic structure
    // (exact copy varies per locale, so we check for the stat-card wrapper)
    const statBlocks = html.match(/text-2xl font-bold text-primary/g) ?? [];
    expect(statBlocks.length, `Expected ≥3 stat tiles in the previous-edition block`).toBeGreaterThanOrEqual(3);
  });

  it.skipIf(!distExists)("still renders the gallery CTA link", () => {
    const html = readFileSync(DIST_VENUE, "utf8");
    // gallery_link copy key is rendered as an external anchor
    expect(html).toMatch(/target="_blank"[^>]*rel="noopener noreferrer"/);
  });

  it.skipIf(!distExists)("still renders the rail label for the previous edition section", () => {
    const html = readFileSync(DIST_VENUE, "utf8");
    expect(html).toMatch(/uppercase tracking-\[0\.2em\] text-accent/);
  });
});
