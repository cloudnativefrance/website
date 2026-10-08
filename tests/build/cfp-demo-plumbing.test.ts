/**
 * Guards the CFP_DEMO build-arg wiring.
 *
 * Source-shape guard, like flag-overrides-plumbing.test.ts — running
 * `docker build` per case is far too slow for CI.
 *
 * What this protects: CFP_DEMO is what puts the CFP demo on staging
 * (src/lib/cfp/demo.ts). If it stopped reaching `pnpm run build`, staging
 * would silently lose its demo; if it reached the main branch, production
 * would refuse to build.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DOCKERFILE = readFileSync(
  resolve(import.meta.dirname, "../../Dockerfile"),
  "utf-8",
);
const WORKFLOW = readFileSync(
  resolve(import.meta.dirname, "../../.github/workflows/build-image.yml"),
  "utf-8",
);
const ASTRO_CONFIG = readFileSync(
  resolve(import.meta.dirname, "../../astro.config.mjs"),
  "utf-8",
);

describe("Dockerfile CFP_DEMO", () => {
  it("declares the build-arg empty by default, so a plain build has no demo", () => {
    expect(DOCKERFILE).toMatch(/^ARG CFP_DEMO=$/m);
  });

  it("promotes it to an ENV set before the build runs", () => {
    const env = DOCKERFILE.search(/^ENV CFP_DEMO=\$CFP_DEMO$/m);
    expect(env).toBeGreaterThan(-1);
    expect(DOCKERFILE.indexOf("pnpm run build")).toBeGreaterThan(env);
  });
});

describe("build-image.yml CFP_DEMO", () => {
  it("turns the demo on for the staging branch only", () => {
    expect(WORKFLOW).toMatch(
      /CFP_DEMO=\$\{\{\s*github\.ref_name == 'staging' && 'true' \|\| ''\s*\}\}/,
    );
    expect(WORKFLOW.match(/CFP_DEMO=/g)).toHaveLength(1);
  });
});

describe("astro.config.mjs sitemap filter", () => {
  it("keeps the CFP demo pages out of the sitemap, both locales", () => {
    // Listing a noindex page in the sitemap is a Search Console error — the
    // demo routes must be filtered out, not just marked un-indexable.
    expect(ASTRO_CONFIG).toContain(String.raw`!/\/cfp\/demo(\/|$)/.test(page)`);
    expect(ASTRO_CONFIG).toContain(
      String.raw`!/\/en\/cfp\/demo(\/|$)/.test(page)`,
    );
  });
});
