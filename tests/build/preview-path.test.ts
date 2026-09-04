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
    // Pinned, not inferred from the wall clock. `loadSessions` takes no `now`,
    // so this case used to rely on `programme` still being closed today — and
    // would have started failing for real on 2027-04-01T09:00, asserting the
    // opposite of what it is named for. The gate under test is "flag closed →
    // no fetch"; say so.
    process.env.FLAG_PROGRAMME = "off";

    const { loadSessions } = await import("@/lib/schedule");

    await expect(loadSessions(2027)).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

/**
 * The fixture used to be able to bypass the flag entirely.
 *
 * `isEditionLoadable` resolved `access` from PRETALX_EVENT alone and never from
 * the fixture, so `PRETALX_PREVIEW_EDITION=2023` read as `access: undefined`,
 * fell through to the arithmetic (`2023 <= 2026` → loadable) and let the
 * loaders take the fixture's own `access: "preview"` branch — serving democon's
 * UNRELEASED schedule at /programme/2023 with the programme flag closed. The
 * gate and the loaders were resolving "which event is this?" differently.
 */
describe("a fixture pointed at a PAST edition is still gated by the flag", () => {
  it("fetches nothing for 2023 and serves the frozen archive instead", async () => {
    process.env.PRETALX_PREVIEW_SLUG = "democon";
    process.env.PRETALX_PREVIEW_EDITION = "2023";
    process.env.PUBLIC_SITE_URL = "http://localhost:4321";
    // Pinned rather than left to the wall clock: `programme` opens 2027-04-01,
    // and a test that depends on today's date starts failing on that date.
    process.env.FLAG_PROGRAMME = "off";

    const { isEditionLoadable } = await import("@/lib/edition-visibility");
    const { loadSessions } = await import("@/lib/schedule");

    expect(isEditionLoadable(2023)).toBe(false);
    const rows = await loadSessions(2023);
    // The committed 2023 archive, not democon's wip schedule.
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.startTime.startsWith("2023-"))).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("the fixture refuses the pipeline shape a release build actually has", () => {
  it("throws out of loadSessions when PUBLIC_SITE_URL is empty", async () => {
    // build-image.yml passes PUBLIC_SITE_URL='' on every non-staging branch,
    // so this — not the literal production URL — is what a production build
    // looks like from inside the code. It must refuse, loudly.
    //
    // Targets 2023, not 2027: 2027 now has a REAL PRETALX_EVENT entry (its
    // Pretalx event exists — see edition-registry.ts), and `PRETALX_EVENT[year]
    // ?? fixtureEvent(year)` never even calls fixtureEvent once a real entry
    // exists — "a fixture only ever stands in for a year with no real
    // PRETALX_EVENT entry" (fixtureEvent's own docstring). So this guard is no
    // longer reachable through year 2027 at all; 2023, which still has no
    // PRETALX_EVENT entry, is the one edition left that exercises it. The
    // production-origin refusal fires before the year is even looked at, so
    // this is not a gap opening elsewhere — 2027's only gate now is the
    // `programme` flag, which build-image.yml only forces on for `staging`.
    process.env.PRETALX_PREVIEW_SLUG = "democon";
    process.env.PRETALX_PREVIEW_EDITION = "2023";
    process.env.PUBLIC_SITE_URL = "";
    process.env.FLAG_OVERRIDES = "programme=on";

    const { loadSessions } = await import("@/lib/schedule");

    await expect(loadSessions(2023)).rejects.toThrow(/PRODUCTION build/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
