/**
 * Phase 17 EDIT-01 / EDIT-07 guard:
 * - Asserts the 2026 edition section renders on both `/` (FR) and `/en/` (EN) with all required
 *   pieces per SC1, SC2, SC4, D-09 (unchanged from 17-03).
 * - Asserts the 2023 edition section is the SIMPLIFIED "minimal" block per 17-04 directive:
 *   no rail, no h2, no stats, no iframe, no brand-note copy; only 3 photos + logo + playlist link.
 *
 * Reads committed `dist/` HTML produced by `pnpm build`. Skips if dist is missing so the test
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

describe("EDIT-07 / 17-04: 2023 simplified minimal block", () => {
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

      it.skipIf(!distExists)("2023 block has NO h2 heading", () => {
        const section = extract2023Section(readFileSync(path, "utf8"));
        expect(section).not.toMatch(/<h2[\s>]/);
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

      it.skipIf(!distExists)("2023 block renders exactly 3 KCD 2023 photos (01, 05, 08)", () => {
        const section = extract2023Section(readFileSync(path, "utf8"));
        const matches = section.match(/<img[^>]+kcd2023[^>]*>/g) ?? [];
        expect(matches.length).toBe(3);
      });

      it.skipIf(!distExists)("2023 block renders the KCD France 2023 logo", () => {
        const section = extract2023Section(readFileSync(path, "utf8"));
        expect(section).toMatch(/alt="Kubernetes Community Days France 2023"/);
      });

      it.skipIf(!distExists)("2023 block renders playlist link to YouTube 2023 playlist", () => {
        const section = extract2023Section(readFileSync(path, "utf8"));
        expect(section).toMatch(
          /href="https:\/\/www\.youtube\.com\/playlist\?list=PLmZ3gFl2Aqt_Qo4EAITE1ewy1ww5jkU2h"/,
        );
        if (locale === "fr") {
          expect(section).toMatch(/Voir la playlist YouTube 2023/);
        } else {
          expect(section).toMatch(/Watch the 2023 YouTube playlist/);
        }
      });
    });
  }
});
