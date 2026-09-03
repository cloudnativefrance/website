/**
 * The preview routing branch (Task 6) is reachable only when both gates agree.
 *
 * `loadSessions`/`loadSpeakers` now resolve `PRETALX_EVENT[year] ?? fixtureEvent(year)`
 * and send an `access: "preview"` entry to `loadPreviewEdition` instead of the
 * anonymous export. Pointing the fixture at democon must not, by itself, fetch
 * anything: `isEditionLoadable` sits OUTSIDE the access check, so a closed gate
 * (the `programme` flag inactive) short-circuits before either branch runs.
 *
 * Mirrors edition-2027-prod-isolation.test.ts's invariant — no fact about a
 * preview edition may appear in a production build — but exercises it through
 * the real fixture/env path instead of a mocked PRETALX_EVENT, which is what
 * data-layer-gate.test.ts already covers.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { stashEnv } from "../support/env-stash";

const fetchSpy = vi.fn();

stashEnv([
  "PRETALX_PREVIEW_SLUG",
  "PRETALX_PREVIEW_EDITION",
  "FLAG_PROGRAMME",
  "FLAG_OVERRIDES",
  "PUBLIC_SITE_URL",
]);

beforeEach(() => {
  vi.stubGlobal("fetch", fetchSpy);
  fetchSpy.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the preview branch stays gated behind isEditionLoadable", () => {
  it("fetches nothing and returns [] for democon with the programme flag inactive", async () => {
    process.env.PRETALX_PREVIEW_SLUG = "democon";
    // A non-production origin, because the fixture now fails closed: an unset
    // or empty PUBLIC_SITE_URL resolves to production and makes
    // resolvePreviewFixture throw (see preview-fixture.ts). This case is about
    // the FLAG gate, so it supplies the origin a local build would.
    process.env.PUBLIC_SITE_URL = "http://localhost:4321";
    // FLAG_PROGRAMME / FLAG_OVERRIDES deliberately left unset: `programme`
    // opens 2027-04-01, so its real, un-overridden state is inactive today.

    const { loadSessions } = await import("@/lib/schedule");

    await expect(loadSessions(2027)).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("the fixture refuses the pipeline shape a release build actually has", () => {
  it("throws out of loadSessions when PUBLIC_SITE_URL is empty", async () => {
    // build-image.yml passes PUBLIC_SITE_URL='' on every non-staging branch,
    // so this — not the literal production URL — is what a production build
    // looks like from inside the code. It must refuse, loudly.
    process.env.PRETALX_PREVIEW_SLUG = "democon";
    process.env.PUBLIC_SITE_URL = "";
    process.env.FLAG_OVERRIDES = "programme=on";

    const { loadSessions } = await import("@/lib/schedule");

    await expect(loadSessions(2027)).rejects.toThrow(/PRODUCTION build/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
