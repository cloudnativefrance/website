/**
 * Guards the build-origin plumbing.
 *
 * `site` feeds canonical URLs, hreflang alternates, OG image URLs and the
 * sitemap. It must default to production so that every existing build path
 * (local `pnpm build`, the `main` branch, workflow_dispatch) is unchanged,
 * and must be overridable so staging builds do not advertise production URLs.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { PROD_ORIGIN } from "../../src/lib/site-env.ts";

const STAGING_ORIGIN = "https://staging.cloudnativedays.fr";

/**
 * The `.env.local` bridge is mocked out, deliberately.
 *
 * `astro.config.mjs` calls `loadLocalEnv()` on import, and it never clobbers a
 * variable the shell already set — but the case below needs PUBLIC_SITE_URL
 * genuinely UNSET, and an unset variable is exactly the one `loadLocalEnv` is
 * free to fill from the file. So a developer with `PUBLIC_SITE_URL` in their
 * `.env.local` watched this suite repopulate the very variable it had just
 * deleted, and fail. `.env.example` no longer suggests parking it there, and
 * this isolates the variable under test regardless: the subject here is the
 * ORIGIN plumbing, and `loadLocalEnv` has its own tests in local-env.test.ts.
 */
async function loadConfig() {
  vi.resetModules();
  vi.doMock("../../scripts/load-local-env.mjs", () => ({ loadLocalEnv: () => [] }));
  return (await import("../../astro.config.mjs")).default;
}

describe("astro.config.mjs site origin", () => {
  const original = process.env.PUBLIC_SITE_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.PUBLIC_SITE_URL;
    else process.env.PUBLIC_SITE_URL = original;
    vi.doUnmock("../../scripts/load-local-env.mjs");
    vi.resetModules();
  });

  it("still bridges .env.local into process.env", () => {
    // loadConfig mocks that call out, which would also hide it going missing —
    // and losing it means every local build silently ships with no Pretalx
    // token. Assert the wiring separately from the behaviour that needs it gone.
    const source = readFileSync("astro.config.mjs", "utf8");
    expect(source).toMatch(/^loadLocalEnv\(\);$/m);
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
