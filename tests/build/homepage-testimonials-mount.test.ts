/**
 * TEST-01 + A11Y-02 (Phase 20).
 *
 * Assumes pnpm build has run. Asserts / and /en/ both render the testimonials
 * strip with dual tracks and locale-appropriate heading.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const FR_HTML = resolve(import.meta.dirname, "../../dist/index.html");
const EN_HTML = resolve(import.meta.dirname, "../../dist/en/index.html");

let fr = "";
let en = "";

beforeAll(() => {
  if (!existsSync(FR_HTML)) throw new Error(`Missing ${FR_HTML}. Run 'pnpm build' first.`);
  if (!existsSync(EN_HTML)) throw new Error(`Missing ${EN_HTML}. Run 'pnpm build' first.`);
  fr = readFileSync(FR_HTML, "utf-8");
  en = readFileSync(EN_HTML, "utf-8");
});

describe("TEST-01 testimonials mount — fr (/)", () => {
  it("renders the FR heading 'Ils en parlent mieux que nous'", () => {
    expect(fr).toContain("Ils en parlent mieux que nous");
  });

  it("renders 6 <blockquote> elements (3 canonical + 3 duplicate)", () => {
    const count = (fr.match(/<blockquote\b/g) ?? []).length;
    expect(count, `Expected 6 blockquotes, got ${count}`).toBe(6);
  });

  it("renders a <ul data-track=\"canonical\"> and a <ul data-track=\"duplicate\">", () => {
    expect(fr).toMatch(/<ul[^>]*data-track="canonical"/);
    expect(fr).toMatch(/<ul[^>]*data-track="duplicate"/);
  });

  it("duplicate track carries aria-hidden AND inert attributes", () => {
    const dupMatch = fr.match(/<ul[^>]*data-track="duplicate"[^>]*>/);
    expect(dupMatch).toBeTruthy();
    expect(dupMatch![0]).toContain('aria-hidden="true"');
    expect(dupMatch![0]).toContain("inert");
  });

  it("contains the first FR placeholder quote text", () => {
    expect(fr).toContain(
      "Une journée riche en rencontres et en partages techniques",
    );
  });
});

describe("TEST-01 testimonials mount — en (/en/)", () => {
  it("renders the EN heading 'They said it better than we could'", () => {
    expect(en).toContain("They said it better than we could");
  });

  it("renders 6 <blockquote> elements (3 canonical + 3 duplicate)", () => {
    const count = (en.match(/<blockquote\b/g) ?? []).length;
    expect(count, `Expected 6 blockquotes, got ${count}`).toBe(6);
  });

  it("duplicate track carries aria-hidden AND inert attributes", () => {
    const dupMatch = en.match(/<ul[^>]*data-track="duplicate"[^>]*>/);
    expect(dupMatch).toBeTruthy();
    expect(dupMatch![0]).toContain('aria-hidden="true"');
    expect(dupMatch![0]).toContain("inert");
  });

  it("contains the first EN placeholder quote text", () => {
    expect(en).toContain(
      "A day packed with high-quality technical exchanges",
    );
  });
});
