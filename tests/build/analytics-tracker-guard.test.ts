/**
 * Guards the production-only analytics tracker in Layout.astro.
 *
 * Source-shape guard rather than a build assertion, matching noindex-guard.test.ts
 * — a full `pnpm build` per case is too slow for CI. The rendered output is
 * verified once, manually, in the deployment task's steps.
 *
 * What this protects: staging runs the same image from the same source, so a
 * tracker that is not gated on the production origin would silently inflate
 * production statistics. That failure is invisible until someone compares the
 * numbers to something else, which is why it gets a guard rather than a comment.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const LAYOUT_PATH = resolve(
  import.meta.dirname,
  "../../src/layouts/Layout.astro",
);

describe("Layout.astro analytics tracker", () => {
  const source = readFileSync(LAYOUT_PATH, "utf-8");

  it("derives the analytics flag from Astro.site, not a separate env flag", () => {
    expect(source).toMatch(
      /const\s+analyticsEnabled\s*=\s*isProductionOrigin\(\s*Astro\.site\?\.origin\s*\)/,
    );
  });

  it("renders the tracker only behind that flag", () => {
    // Anchor on the src attribute, not the bare filename: the filename also
    // appears in the explanatory comment above the tag, and matching that
    // instead would assert against the wrong region of the file.
    const idx = source.indexOf('src="https://stats.cloudnativedays.fr/cnd.js"');
    expect(idx).toBeGreaterThan(-1);
    expect(source.slice(Math.max(0, idx - 400), idx)).toContain(
      "analyticsEnabled &&",
    );
  });

  it("does not scope the tracker with data-domains", () => {
    // The origin is the single source of truth; a hardcoded domain list would be
    // a second one, which is the drift src/lib/site-env.ts exists to prevent.
    // Match the attribute form (`data-domains=`) so prose explaining why we do
    // not use it does not trip the guard.
    expect(source).not.toMatch(/data-domains\s*=/);
  });

  it("honours Do Not Track", () => {
    expect(source).toContain('data-do-not-track="true"');
  });
});
