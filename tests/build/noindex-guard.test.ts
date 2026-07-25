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

  it("emits noindex, nofollow only when not indexable", () => {
    expect(source).toMatch(
      /\{\s*!indexable\s*&&\s*\(?\s*<meta\s+name="robots"\s+content="noindex, nofollow"\s*\/>/,
    );
  });
});
