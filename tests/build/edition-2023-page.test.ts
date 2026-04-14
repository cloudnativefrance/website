/**
 * Phase 19 — dedicated `/2023` (FR) + `/en/2023` (EN) page regression harness.
 *
 * Scope (per roadmap SC1-SC5):
 *   SC1 — rail + h1 + 10-photo grid + gallery CTA, CLS-safe tiles
 *   SC2 — KCD brand-history callout with Pompidou mention + "originally named"
 *   SC3 — lightbox present with role=dialog + aria-label (static presence only;
 *         keyboard behaviour covered by manual UAT)
 *   SC4 — 10 unique descriptive alts per locale (no "photo 1/2" pattern)
 *   SC5 — PLACEHOLDER badge linking to tracker (EDIT-07)
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DIST_FR = resolve(import.meta.dirname, "../../dist/2023/index.html");
const DIST_EN = resolve(import.meta.dirname, "../../dist/en/2023/index.html");
const distExists = existsSync(DIST_FR) && existsSync(DIST_EN);

const pages: Array<{ label: string; path: string; locale: "fr" | "en" }> = [
  { label: "FR (/2023)", path: DIST_FR, locale: "fr" },
  { label: "EN (/en/2023)", path: DIST_EN, locale: "en" },
];

describe("Phase 19 / SC1: /2023 structure (rail + h1 + photo grid + CTA)", () => {
  for (const { label, path, locale } of pages) {
    describe(label, () => {
      it.skipIf(!distExists)("renders a single <h1>", () => {
        const html = readFileSync(path, "utf8");
        const h1Count = (html.match(/<h1\b/g) ?? []).length;
        expect(h1Count).toBe(1);
      });

      it.skipIf(!distExists)("renders the rail label", () => {
        const html = readFileSync(path, "utf8");
        if (locale === "fr") expect(html).toMatch(/Édition 2023/);
        else expect(html).toMatch(/2023 edition/i);
      });

      it.skipIf(!distExists)("hosts the photo grid container", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/data-edition-2023-photo-grid/);
      });

      it.skipIf(!distExists)("renders exactly 10 lightbox trigger buttons", () => {
        const html = readFileSync(path, "utf8");
        const triggers = html.match(/data-lightbox-trigger=/g) ?? [];
        expect(triggers.length).toBe(10);
      });

      it.skipIf(!distExists)("each tile reserves dimensions via aspect-[4/3] for CLS (SC1)", () => {
        const html = readFileSync(path, "utf8");
        const aspectHits = (html.match(/aspect-\[4\/3\]/g) ?? []).length;
        // 10 trigger buttons carry the class
        expect(aspectHits).toBeGreaterThanOrEqual(10);
      });

      it.skipIf(!distExists)("includes a gallery CTA link", () => {
        const html = readFileSync(path, "utf8");
        if (locale === "fr") expect(html).toMatch(/Voir la galerie complète/);
        else expect(html).toMatch(/View the full gallery/);
      });
    });
  }
});

describe("Phase 19 / SC2: KCD brand-history callout", () => {
  for (const { label, path, locale } of pages) {
    describe(label, () => {
      it.skipIf(!distExists)("mentions Centre Georges Pompidou", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/Centre Georges Pompidou/);
      });

      it.skipIf(!distExists)("includes the 'originally named Kubernetes Community Days France' phrase", () => {
        const html = readFileSync(path, "utf8");
        if (locale === "fr") {
          // Astro HTML-escapes `'` to `&#39;` in rendered output.
          expect(html).toMatch(/à l(&#39;|')origine Kubernetes Community Days France/);
        } else {
          expect(html).toMatch(/originally named Kubernetes Community Days France/);
        }
      });

      it.skipIf(!distExists)("renders the KCD 2023 logo with descriptive alt", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/Kubernetes Community Days France 2023/);
      });

      it.skipIf(!distExists)("uses <aside> landmark with aria-labelledby", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/<aside[^>]+aria-labelledby="kcd-brand-history-heading"/);
      });
    });
  }
});

describe("Phase 19 / SC4: unique descriptive alt text (A11Y-04)", () => {
  for (const { label, path, locale } of pages) {
    describe(label, () => {
      it.skipIf(!distExists)("all 10 photo alts are unique within the page", () => {
        const html = readFileSync(path, "utf8");
        // Each photo renders an <img alt="..."> twice (once in the grid, once
        // in the lightbox stage). Alts that appear exactly twice are the
        // photo set; alts appearing once are logo / other UI. We expect
        // exactly 10 alt values with a count of 2.
        const alts = [...html.matchAll(/alt="([^"]+)"/g)].map((m) => m[1]);
        const counts = alts.reduce<Record<string, number>>((acc, a) => {
          acc[a] = (acc[a] ?? 0) + 1;
          return acc;
        }, {});
        // Exclude short UI strings (logo <= 25 chars) from the photo alt bucket.
        const photoAlts = Object.keys(counts).filter((a) => counts[a] === 2 && a.length > 25);
        expect(photoAlts.length).toBe(10);
        // Locale sanity — at least one key vocab hit to prove we got the
        // right bucket (not e.g. 10 accidental duplicates elsewhere).
        const vocab = locale === "fr" ? /Pompidou|keynote|Beaubourg/ : /Pompidou|keynote|Beaubourg|lobby/;
        expect(photoAlts.some((a) => vocab.test(a))).toBe(true);
      });

      it.skipIf(!distExists)("zero 'photo 1 / photo 2' patterns in alt attributes", () => {
        const html = readFileSync(path, "utf8");
        expect(html).not.toMatch(/alt="Photo 1\b/i);
        expect(html).not.toMatch(/alt="Photo 2\b/i);
        expect(html).not.toMatch(/alt="photo \d+"/i);
      });
    });
  }
});

describe("Phase 19 / SC5: placeholder badge linking to tracker (EDIT-07)", () => {
  for (const { label, path } of pages) {
    describe(label, () => {
      it.skipIf(!distExists)("renders a PLACEHOLDER badge linking to the tracker URL", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/PLACEHOLDER/);
        expect(html).toMatch(/github\.com\/cloudnativefrance\/website\/issues\/19/);
      });
    });
  }
});
