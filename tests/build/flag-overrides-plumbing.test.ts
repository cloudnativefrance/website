/**
 * Guards the FLAG_OVERRIDES build-arg wiring.
 *
 * Source-shape guard rather than a build assertion, matching noindex-guard.test.ts
 * — running `docker build` per case is far too slow for CI.
 *
 * What this protects: this wiring is the ONLY thing that makes the staging image
 * differ from production. If the build-arg stops reaching `pnpm run build`, the
 * failure is silent and symmetrical — staging quietly stops showing the 2027
 * programme, which looks exactly like "the programme is not ready yet".
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

describe("Dockerfile FLAG_OVERRIDES", () => {
  it("declares the build-arg with an empty default", () => {
    expect(DOCKERFILE).toMatch(/^ARG FLAG_OVERRIDES=$/m);
  });

  it("promotes it to an ENV so the build step sees it", () => {
    expect(DOCKERFILE).toMatch(/^ENV FLAG_OVERRIDES=\$FLAG_OVERRIDES$/m);
  });

  it("sets the ENV before the build runs, not after", () => {
    const env = DOCKERFILE.indexOf("ENV FLAG_OVERRIDES=");
    const build = DOCKERFILE.indexOf("pnpm run build");
    expect(env).toBeGreaterThan(-1);
    expect(build).toBeGreaterThan(env);
  });

  it("declares it after pnpm install so the dependency layer stays cached", () => {
    const install = DOCKERFILE.indexOf("pnpm install --frozen-lockfile");
    expect(DOCKERFILE.indexOf("ARG FLAG_OVERRIDES=")).toBeGreaterThan(install);
  });
});

describe("build-image.yml FLAG_OVERRIDES", () => {
  it("passes the build-arg", () => {
    expect(WORKFLOW).toContain("FLAG_OVERRIDES=");
  });

  it("enables the programme flag only for the staging branch", () => {
    expect(WORKFLOW).toMatch(
      /FLAG_OVERRIDES=\$\{\{\s*github\.ref_name == 'staging' && 'programme=on' \|\| ''\s*\}\}/,
    );
  });

  it("keeps the token a secret rather than a build-arg", () => {
    // Regression guard: build-args land in image history, readable by anyone who
    // can pull the image. Adding FLAG_OVERRIDES next to PUBLIC_SITE_URL must not
    // tempt anyone to move the token there too.
    //
    // Scoped to the build-args block by indentation rather than by regexing the
    // whole file: `secrets: pretalx_token=` legitimately appears later on, so a
    // `[\s\S]*` scan would match it and the assertion could never pass.
    const lines = WORKFLOW.split("\n");
    const start = lines.findIndex((l) => l.trim().startsWith("build-args:"));
    expect(start).toBeGreaterThan(-1);
    const indent = lines[start].search(/\S/);
    const block: string[] = [];
    for (const line of lines.slice(start + 1)) {
      if (line.trim() && line.search(/\S/) <= indent) break;
      block.push(line);
    }
    expect(block.join("\n")).toContain("FLAG_OVERRIDES=");
    expect(block.join("\n")).not.toContain("pretalx_token");
    expect(WORKFLOW).toMatch(/secrets:\s*\|\s*\n\s*pretalx_token=/);
  });
});
