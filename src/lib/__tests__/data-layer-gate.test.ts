import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The gate must short-circuit BEFORE any network call. Stubbing fetch and
// asserting it was never invoked is the only test that proves "never fetched"
// rather than "fetched and discarded".
const fetchSpy = vi.fn();

// The second case below lets loadSessions reach loadLevelAnswers for real. With
// no token it fails fast (MissingTokenError, no retry); with one — e.g. a
// developer's own .env.local — the stubbed fetch above returns `undefined`,
// which pretalx-private.ts treats as a retryable failure and retries three
// times over several real seconds before degrading. Clearing the token here
// keeps this file's timing independent of whichever machine runs it.
const TOKEN_ENV_KEYS = ["PRETALX_API_TOKEN", "PRETALX_API_TOKEN_FILE"] as const;
const savedTokenEnv = new Map<string, string | undefined>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchSpy);
  fetchSpy.mockReset();
  for (const key of TOKEN_ENV_KEYS) {
    savedTokenEnv.set(key, process.env[key]);
    delete process.env[key];
  }
});
afterEach(() => {
  vi.unstubAllGlobals();
  // vi.doMock registrations outlive resetModules() — it only clears the module
  // cache, not the mock registry — so without this the second test's unmocked
  // "@/lib/pretalx" import would still see the first test's mocked PRETALX_EVENT.
  vi.doUnmock("@/lib/pretalx");
  vi.doUnmock("@/lib/edition-visibility");
  vi.resetModules();
  for (const [key, value] of savedTokenEnv) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("loadSessions / loadSpeakers gate", () => {
  it("returns the frozen archive and issues no fetch for a non-loadable edition", async () => {
    vi.doMock("@/lib/edition-visibility", () => ({
      isEditionLoadable: () => false,
      assertEditionPublishable: () => {},
    }));
    vi.doMock("@/lib/pretalx", async (orig) => {
      const actual = await orig<typeof import("@/lib/pretalx")>();
      return {
        ...actual,
        PRETALX_EVENT: { 2027: { slug: "democon", access: "preview" } },
      };
    });

    const { loadSessions } = await import("@/lib/schedule");
    const { loadSpeakers } = await import("@/lib/speaker-source");

    await expect(loadSessions(2027)).resolves.toEqual([]);
    await expect(loadSpeakers(2027)).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("still reads a loadable public edition through its normal path", async () => {
    vi.doMock("@/lib/edition-visibility", () => ({
      isEditionLoadable: () => true,
      assertEditionPublishable: () => {},
    }));
    const { loadSessions } = await import("@/lib/schedule");
    // 2026 falls back to the committed snapshot when fetch is stubbed out.
    const rows = await loadSessions(2026);
    expect(rows.length).toBeGreaterThan(0);
  });
});
