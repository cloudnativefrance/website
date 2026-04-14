/**
 * Phase 19 — lightbox a11y static assertions (EDIT-05, A11Y-03).
 *
 * The full keyboard contract (focus trap, focus return, arrow wraparound)
 * requires a real browser. Here we assert every STATIC invariant we can read
 * out of the rendered HTML / inlined script:
 *   - role="dialog" + aria-modal="true" + aria-label present
 *   - close / prev / next buttons carry aria-labels
 *   - controller script contains the keyboard branches (Escape / ArrowLeft /
 *     ArrowRight / Tab) and focus-trap hooks
 *
 * Manual UAT items are tracked in 19-UAT.md.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DIST_FR = resolve(import.meta.dirname, "../../dist/2023/index.html");
const DIST_EN = resolve(import.meta.dirname, "../../dist/en/2023/index.html");
const distExists = existsSync(DIST_FR) && existsSync(DIST_EN);

const pages = [
  { label: "FR (/2023)", path: DIST_FR, locale: "fr" as const },
  { label: "EN (/en/2023)", path: DIST_EN, locale: "en" as const },
];

describe("Phase 19 lightbox a11y static assertions (A11Y-03)", () => {
  for (const { label, path, locale } of pages) {
    describe(label, () => {
      it.skipIf(!distExists)('has <div role="dialog" aria-modal="true"> with aria-label', () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/id="edition-2023-lightbox"/);
        expect(html).toMatch(/role="dialog"/);
        expect(html).toMatch(/aria-modal="true"/);
        expect(html).toMatch(/aria-label="[^"]*(visionneuse|viewer)[^"]*"/);
      });

      it.skipIf(!distExists)("dialog starts hidden (aria-hidden=true) for progressive enhancement", () => {
        const html = readFileSync(path, "utf8");
        // The root element carries aria-hidden="true" inline
        expect(html).toMatch(/id="edition-2023-lightbox"[^>]*aria-hidden="true"/s);
      });

      it.skipIf(!distExists)("close / prev / next buttons each expose an aria-label", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/data-lightbox-close[^>]*/);
        expect(html).toMatch(/data-lightbox-prev[^>]*/);
        expect(html).toMatch(/data-lightbox-next[^>]*/);
        // Each button has aria-label attribute nearby
        const closeSection = html.match(/<button[^>]*data-lightbox-close[^>]*>/)?.[0] ?? "";
        const prevSection = html.match(/<button[^>]*data-lightbox-prev[^>]*>/)?.[0] ?? "";
        const nextSection = html.match(/<button[^>]*data-lightbox-next[^>]*>/)?.[0] ?? "";
        expect(closeSection).toMatch(/aria-label="[^"]+"/);
        expect(prevSection).toMatch(/aria-label="[^"]+"/);
        expect(nextSection).toMatch(/aria-label="[^"]+"/);
        // Locale sanity
        if (locale === "fr") {
          expect(html).toMatch(/aria-label="Fermer la visionneuse"/);
        } else {
          expect(html).toMatch(/aria-label="Close the viewer"/);
        }
      });

      it.skipIf(!distExists)("inline controller script wires Escape / ArrowLeft / ArrowRight / Tab branches", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/"Escape"/);
        expect(html).toMatch(/"ArrowLeft"/);
        expect(html).toMatch(/"ArrowRight"/);
        expect(html).toMatch(/"Tab"/);
      });

      it.skipIf(!distExists)("controller script restores focus to originTrigger on close", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/originTrigger/);
      });

      it.skipIf(!distExists)("controller script locks body scroll while open", () => {
        const html = readFileSync(path, "utf8");
        expect(html).toMatch(/document\.body\.classList\.add\("overflow-hidden"\)/);
        expect(html).toMatch(/document\.body\.classList\.remove\("overflow-hidden"\)/);
      });
    });
  }
});
