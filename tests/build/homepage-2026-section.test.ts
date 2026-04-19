/**
 * Phase 17 EDIT-01 / EDIT-07 guard, retargeted in Phase 26 for the v1.2 homepage:
 * - Asserts the 2026 edition section (now Edition2026Combined per Phase 23) renders on both
 *   `/` (FR) and `/en/` (EN) with anchor + iframe + main-landmark mount.
 * - Asserts the v1.2 section ordering: Edition2026Combined → Edition2023Link → CfpSection
 *   (the inverse of the v1.1 CFP-first order).
 * - Asserts the 2023 edition block (now Edition2023Link.astro per Phase 24-03 / Phase 26-01)
 *   is the simplified pointer block: anchor + KCD logo + compact title + locale-correct
 *   /2023 view-page link, with NO rail label, NO stats digits, NO iframe, NO brand-note prose,
 *   NO embedded photos, NO playlist link (those moved to the dedicated /2023 page).
 *
 * Reads committed `dist/` HTML produced by `bun run build`. Skips if dist is missing so the test
 * file can land before the mount commit without blocking.
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

/** Extract the `<section id="edition-2023">...</section>` slice from the rendered HTML. */
function extract2023Section(html: string): string {
  const match = html.match(/<section[^>]*id="edition-2023"[^>]*>([\s\S]*?)<\/section>/);
  return match ? match[0] : "";
}

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

      it.skipIf(!distExists)("places sections in v1.2 order: 2026 BEFORE 2023 BEFORE CFP", () => {
        const html = readFileSync(path, "utf8");
        // v1.2 reorders to Hero → KeyNumbers → Edition2026Combined → Edition2023Link → CFP → SponsorsPlatinumStrip
        const cfpIdx = html.indexOf('id="cfp"');
        const section2026 = html.indexOf('id="edition-2026"');
        const section2023 = html.indexOf('id="edition-2023"');
        expect(section2026, "#edition-2026 not found").toBeGreaterThan(-1);
        expect(section2023, "#edition-2023 not found").toBeGreaterThan(section2026);
        expect(cfpIdx, "CFP anchor not found").toBeGreaterThan(section2023);
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

describe("Phase 26: 2023 simplified pointer block (Edition2023Link.astro)", () => {
  for (const { label, path, locale } of pages) {
    describe(label, () => {
      it.skipIf(!distExists)("preserves id=\"edition-2023\" anchor", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/id="edition-2023"/);
      });

      it.skipIf(!distExists)("2023 block has NO rotated rail label", () => {
        const section = extract2023Section(readFileSync(path, "utf8"));
        expect(section).not.toMatch(/EDITION 2023/);
        expect(section).not.toMatch(/2023 EDITION/);
      });

      it.skipIf(!distExists)("2023 block shows compact title alongside logo", () => {
        const section = extract2023Section(readFileSync(path, "utf8"));
        expect(section).toMatch(/Kubernetes Community Days France/);
      });

      it.skipIf(!distExists)("2023 block has NO stats digits (1700+/42/24)", () => {
        const section = extract2023Section(readFileSync(path, "utf8"));
        expect(section).not.toMatch(/1\s?700\+|1,700\+/);
        expect(section).not.toMatch(/>\s*42\s*</);
        expect(section).not.toMatch(/>\s*24\s*</);
      });

      it.skipIf(!distExists)("2023 block has NO YouTube iframe", () => {
        const section = extract2023Section(readFileSync(path, "utf8"));
        expect(section).not.toMatch(/<iframe[^>]*youtube/i);
      });

      it.skipIf(!distExists)("2023 block has NO brand_note copy", () => {
        const section = extract2023Section(readFileSync(path, "utf8"));
        if (locale === "fr") {
          expect(section).not.toMatch(/première édition francophone/);
        } else {
          expect(section).not.toMatch(/first French-language edition/);
        }
      });

      it.skipIf(!distExists)("2023 block has NO embedded photos (figures live on the dedicated /2023 page now)", () => {
        const section = extract2023Section(readFileSync(path, "utf8"));
        const figureMatches = section.match(/<figure\b/g) ?? [];
        expect(figureMatches.length, "Edition2023Link is logo + heading + view-page link only").toBe(0);
      });

      it.skipIf(!distExists)("2023 block has NO playlist link (moved to the dedicated /2023 page)", () => {
        const section = extract2023Section(readFileSync(path, "utf8"));
        expect(section).not.toMatch(/list=PLmZ3gFl2Aqt_Qo4EAITE1ewy1ww5jkU2h/);
      });

      it.skipIf(!distExists)("2023 block renders the KCD France 2023 logo", () => {
        const section = extract2023Section(readFileSync(path, "utf8"));
        expect(section).toMatch(/alt="Kubernetes Community Days France 2023"/);
      });

      it.skipIf(!distExists)("2023 block links to the dedicated /2023 page with a locale-correct href (21-02 / EDIT-02 discovery-loop)", () => {
        const section = extract2023Section(readFileSync(path, "utf8"));
        if (locale === "fr") {
          expect(section).toMatch(/<a href="\/2023"/);
        } else {
          expect(section).toMatch(/<a href="\/en\/2023"/);
        }
      });

      it.skipIf(!distExists)("2023 block view-page link does not leak the wrong locale (parity guard)", () => {
        const section = extract2023Section(readFileSync(path, "utf8"));
        if (locale === "fr") {
          expect(section).not.toMatch(/<a href="\/en\/2023"/);
        } else {
          expect(section).not.toMatch(/<a href="\/2023"(?!\d)/);
        }
      });

      it.skipIf(!distExists)("2023 block view-page link uses the localized CTA copy", () => {
        const section = extract2023Section(readFileSync(path, "utf8"));
        if (locale === "fr") {
          expect(section).toMatch(/Voir l(?:['’]|&#39;|&rsquo;)édition 2023/);
        } else {
          expect(section).toMatch(/View the 2023 edition/);
        }
      });
    });
  }
});
