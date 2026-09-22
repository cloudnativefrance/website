/**
 * Guards the non-production noindex meta tag in Layout.astro.
 *
 * Source-shape guard rather than a build assertion, matching the other
 * tests/build/ specs — a full `pnpm build` per case is too slow for CI.
 * The rendered output is verified once, manually, in the task's steps.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const LAYOUT_PATH = resolve(
  import.meta.dirname,
  "../../src/layouts/Layout.astro",
);

describe("Layout.astro robots meta", () => {
  const source = readFileSync(LAYOUT_PATH, "utf-8");

  it("imports the production-origin predicate rather than inlining the URL", () => {
    expect(source).toContain("isProductionOrigin");
    expect(source).toContain("@/lib/site-env");
  });

  it("derives an indexable flag from Astro.site", () => {
    expect(source).toMatch(
      /const\s+indexable\s*=\s*isProductionOrigin\(\s*Astro\.site\?\.origin\s*\)/,
    );
  });

  it("emits noindex, nofollow when not indexable, or when a page forces it", () => {
    expect(source).toMatch(
      /\{\s*\(\s*!indexable\s*\|\|\s*noindex\s*\)\s*&&\s*\(?\s*<meta\s+name="robots"\s+content="noindex, nofollow"\s*\/>/,
    );
  });

  it("defaults the forced noindex to off, so only opting-in pages carry it", () => {
    expect(source).toMatch(/noindex\s*=\s*false/);
  });
});
