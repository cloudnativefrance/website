/**
 * Guards the build-origin plumbing.
 *
 * `site` feeds canonical URLs, hreflang alternates, OG image URLs and the
 * sitemap. It must default to production so that every existing build path
 * (local `pnpm build`, the `main` branch, workflow_dispatch) is unchanged,
 * and must be overridable so staging builds do not advertise production URLs.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { PROD_ORIGIN } from "../../src/lib/site-env.ts";

const STAGING_ORIGIN = "https://staging.cloudnativedays.fr";

async function loadConfig() {
  vi.resetModules();
  return (await import("../../astro.config.mjs")).default;
}

describe("astro.config.mjs site origin", () => {
  const original = process.env.PUBLIC_SITE_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.PUBLIC_SITE_URL;
    else process.env.PUBLIC_SITE_URL = original;
  });

  it("defaults to the production origin when PUBLIC_SITE_URL is unset", async () => {
    delete process.env.PUBLIC_SITE_URL;
    const config = await loadConfig();
    expect(config.site).toBe(PROD_ORIGIN);
  });

  it("honours PUBLIC_SITE_URL when set", async () => {
    process.env.PUBLIC_SITE_URL = STAGING_ORIGIN;
    const config = await loadConfig();
    expect(config.site).toBe(STAGING_ORIGIN);
  });

  it("falls back to the production origin when PUBLIC_SITE_URL is empty", async () => {
    // Regression guard: Dockerfile sets `ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL`
    // with an empty ARG default. `??` would treat that empty string as "set"
    // and ship the site un-indexable; `||` must fall back to production.
    process.env.PUBLIC_SITE_URL = "";
    const config = await loadConfig();
    expect(config.site).toBe(PROD_ORIGIN);
  });
});
