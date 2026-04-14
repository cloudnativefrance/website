/**
 * TEST-03 (Phase 20, D-01/D-02/D-03).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TESTIMONIALS } from "../../src/lib/testimonials-data";
import { ui } from "../../src/i18n/ui";

const DATA_PATH = resolve(
  import.meta.dirname,
  "../../src/lib/testimonials-data.ts",
);

describe("TEST-03 testimonials-data contract", () => {
  it("exports exactly 3 placeholder entries", () => {
    expect(TESTIMONIALS).toHaveLength(3);
  });

  it("every entry has a unique id", () => {
    const ids = TESTIMONIALS.map((t) => t.id);
    expect(new Set(ids).size).toBe(TESTIMONIALS.length);
  });

  it("every quoteKey + attributionKey resolves in ui.fr AND ui.en", () => {
    for (const entry of TESTIMONIALS) {
      expect(
        ui.fr[entry.quoteKey as keyof typeof ui.fr],
        `Missing FR key ${entry.quoteKey}`,
      ).toBeTruthy();
      expect(
        ui.en[entry.quoteKey as keyof typeof ui.en],
        `Missing EN key ${entry.quoteKey}`,
      ).toBeTruthy();
      expect(
        ui.fr[entry.attributionKey as keyof typeof ui.fr],
        `Missing FR key ${entry.attributionKey}`,
      ).toBeTruthy();
      expect(
        ui.en[entry.attributionKey as keyof typeof ui.en],
        `Missing EN key ${entry.attributionKey}`,
      ).toBeTruthy();
    }
  });

  it("source file header references the testimonials-real-quotes tracker", () => {
    const src = readFileSync(DATA_PATH, "utf-8");
    expect(src).toContain("testimonials-real-quotes");
  });

  it("attributions are clearly non-real (no fabricated full corporate names)", () => {
    // Per SC4: no real full-name + real-company patterns. Our placeholders use
    // single-letter first names ("A. Morel") + "fictive/placeholder/imaginaire"
    // markers. Assert both FR and EN attributions contain one of those markers.
    const PLACEHOLDER_MARKERS = [
      "fictive",
      "fictif",
      "placeholder",
      "imaginaire",
    ];
    for (const entry of TESTIMONIALS) {
      const fr = ui.fr[entry.attributionKey as keyof typeof ui.fr] as string;
      const en = ui.en[entry.attributionKey as keyof typeof ui.en] as string;
      const frOk = PLACEHOLDER_MARKERS.some((m) =>
        fr.toLowerCase().includes(m),
      );
      const enOk = PLACEHOLDER_MARKERS.some((m) =>
        en.toLowerCase().includes(m),
      );
      expect(frOk, `FR attribution missing placeholder marker: ${fr}`).toBe(
        true,
      );
      expect(enOk, `EN attribution missing placeholder marker: ${en}`).toBe(
        true,
      );
    }
  });
});
