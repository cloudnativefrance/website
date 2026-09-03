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

const fetchSpy = vi.fn();

const ENV_KEYS = [
  "PRETALX_PREVIEW_SLUG",
  "PRETALX_PREVIEW_EDITION",
  "FLAG_PROGRAMME",
  "FLAG_OVERRIDES",
  "PUBLIC_SITE_URL",
] as const;
const savedEnv = new Map<string, string | undefined>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchSpy);
  fetchSpy.mockReset();
  for (const key of ENV_KEYS) {
    savedEnv.set(key, process.env[key]);
    delete process.env[key];
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const [key, value] of savedEnv) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("the preview branch stays gated behind isEditionLoadable", () => {
  it("fetches nothing and returns [] for democon with the programme flag inactive", async () => {
    process.env.PRETALX_PREVIEW_SLUG = "democon";
    // FLAG_PROGRAMME / FLAG_OVERRIDES deliberately left unset: `programme`
    // opens 2027-04-01, so its real, un-overridden state is inactive today.

    const { loadSessions } = await import("@/lib/schedule");

    await expect(loadSessions(2027)).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
