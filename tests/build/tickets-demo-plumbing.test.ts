/**
 * Guards the TICKETS_DEMO build-arg wiring.
 *
 * Source-shape guard, like flag-overrides-plumbing.test.ts — running
 * `docker build` per case is far too slow for CI.
 *
 * What this protects: TICKETS_DEMO is what puts the ticketing demo on staging
 * (src/lib/tickets/demo.ts). If it stopped reaching `pnpm run build`, staging
 * would silently lose its demo; if it reached the main branch, production would
 * refuse to build.
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

describe("Dockerfile TICKETS_DEMO", () => {
  it("declares the build-arg empty by default, so a plain build has no demo", () => {
    expect(DOCKERFILE).toMatch(/^ARG TICKETS_DEMO=$/m);
  });

  it("promotes it to an ENV set before the build runs", () => {
    const env = DOCKERFILE.search(/^ENV TICKETS_DEMO=\$TICKETS_DEMO$/m);
    expect(env).toBeGreaterThan(-1);
    expect(DOCKERFILE.indexOf("pnpm run build")).toBeGreaterThan(env);
  });

  it("declares it after pnpm install so the dependency layer stays cached", () => {
    const install = DOCKERFILE.indexOf("pnpm install --frozen-lockfile");
    expect(DOCKERFILE.indexOf("ARG TICKETS_DEMO=")).toBeGreaterThan(install);
  });
});

describe("build-image.yml TICKETS_DEMO", () => {
  it("turns the demo on for the staging branch only", () => {
    expect(WORKFLOW).toMatch(
      /TICKETS_DEMO=\$\{\{\s*github\.ref_name == 'staging' && 'true' \|\| ''\s*\}\}/,
    );
    expect(WORKFLOW.match(/TICKETS_DEMO=/g)).toHaveLength(1);
  });
});
