/**
 * Phase 26 rewrite of TEST-01 (originally Phase 20).
 *
 * Phase 23 D-09 moved testimonials INTO Edition2026Combined.astro as a
 * static 3-up grid (no marquee, no duplicate track). Phase 26-01 mounted
 * Edition2026Combined on both homepages. This test now asserts the new
 * static contract:
 *   - localised testimonials heading (FR/EN i18n keys)
 *   - exactly 3 <blockquote> elements (no duplicate marquee track)
 *   - no leftover marquee data-track attributes
 *   - first placeholder quote text present (smoke check that data wired)
 *
 * Assumes `bun run build` has produced dist/. Skips cleanly if dist is missing.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const FR_HTML = resolve(import.meta.dirname, "../../dist/index.html");
const EN_HTML = resolve(import.meta.dirname, "../../dist/en/index.html");
const distExists = existsSync(FR_HTML) && existsSync(EN_HTML);

const pages: Array<{
  label: string;
  path: string;
  heading: string;
  firstQuote: string;
}> = [
  {
    label: "FR (/)",
    path: FR_HTML,
    heading: "Ils en parlent mieux que nous",
    firstQuote:
      "Une journée riche en rencontres et en partages techniques",
  },
  {
    label: "EN (/en/)",
    path: EN_HTML,
    heading: "They said it better than we could",
    firstQuote: "A day packed with high-quality technical exchanges",
  },
];

describe("Phase 26 testimonials mount (static 3-up grid inside Edition2026Combined)", () => {
  for (const { label, path, heading, firstQuote } of pages) {
    describe(label, () => {
      it.skipIf(!distExists)(`renders the localised testimonials heading "${heading}"`, () => {
        const html = readFileSync(path, "utf8");
        expect(html).toContain(heading);
      });

      it.skipIf(!distExists)("renders exactly 3 <blockquote> elements (no marquee duplicate track)", () => {
        const html = readFileSync(path, "utf8");
        const count = (html.match(/<blockquote\b/g) ?? []).length;
        expect(count, `Expected 3 blockquotes, got ${count}`).toBe(3);
      });

      it.skipIf(!distExists)("does NOT carry the legacy marquee data-track attribute", () => {
        const html = readFileSync(path, "utf8");
        expect(html).not.toMatch(/data-track="canonical"/);
        expect(html).not.toMatch(/data-track="duplicate"/);
      });

      it.skipIf(!distExists)("contains the first placeholder quote (data wired)", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toContain(firstQuote);
      });
    });
  }
});
