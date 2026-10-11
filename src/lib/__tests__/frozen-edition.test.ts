import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { stashEnv } from "../../../tests/support/env-stash";
import { resolveEditionLoadable } from "@/lib/edition-visibility";

// Fail-closed proof for the "frozen" access mode: a frozen edition's data is
// the committed archive, so NO request may leave the process — not the export,
// not the enrichment, not an avatar probe. Stubbing fetch and asserting it was
// never invoked is the only test shape that proves "never fetched" rather than
// "fetched and discarded". Mirrors data-layer-gate.test.ts's method.
const fetchSpy = vi.fn();

stashEnv(["PRETALX_API_TOKEN", "PRETALX_API_TOKEN_FILE"]);

const CURRENT = 2026 as const;

beforeEach(() => {
  vi.stubGlobal("fetch", fetchSpy);
  fetchSpy.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.doUnmock("@/lib/edition-registry");
  vi.doUnmock("@/lib/edition-visibility");
  vi.resetModules();
});

/**
 * A registry where the PAST 2023 edition is marked `access: "frozen"` — the
 * shape `PRETALX_EVENT[2026]` gets once the edition is frozen. 2023 is used
 * because its archive already exists, so these tests pin the dispatch itself
 * rather than the existence of a 2026 archive file (which is the separate
 * guard test in edition-visibility.test.ts).
 */
async function loadersWithFrozenRegistry(frozenYear: 2023 | 2027) {
  vi.doMock("@/lib/edition-registry", async (orig) => {
    const actual = await orig<typeof import("@/lib/edition-registry")>();
    return {
      ...actual,
      PRETALX_EVENT: {
        [frozenYear]: { slug: String(frozenYear), access: "frozen" },
      },
    };
  });
  // Force the visibility gate OPEN: if a frozen edition could reach the
  // network at all, this is where it would happen. Zero fetches under an
  // open gate is the whole point.
  vi.doMock("@/lib/edition-visibility", () => ({
    isEditionLoadable: () => true,
    assertEditionPublishable: () => {},
  }));
  const { loadSessions } = await import("@/lib/schedule");
  const { loadSpeakers } = await import("@/lib/speaker-source");
  return { loadSessions, loadSpeakers };
}

describe("frozen dispatch", () => {
  it("loadSessions returns the frozen archive with the gate open and fetches nothing", async () => {
    const { loadSessions } = await loadersWithFrozenRegistry(2023);
    const rows = await loadSessions(2023);
    // The real committed archive — sessions-2023.json, 6 rows.
    expect(rows.length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("loadSpeakers returns the frozen archive with the gate open and fetches nothing", async () => {
    const { loadSpeakers } = await loadersWithFrozenRegistry(2023);
    const records = await loadSpeakers(2023);
    expect(records.length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("a frozen FUTURE edition reads its archive even with the flag-open gate — fail closed", async () => {
    // A frozen edition must never enter the public-fetch branch, whatever the
    // arithmetic says. 2027 has an empty archive ([]) — asserting [] plus zero
    // fetches proves the archive was read rather than a fetch being attempted
    // and discarded (which would return non-[] or throw).
    const { loadSessions, loadSpeakers } =
      await loadersWithFrozenRegistry(2027);
    await expect(loadSessions(2027)).resolves.toEqual([]);
    await expect(loadSpeakers(2027)).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("resolveEditionLoadable with a frozen edition", () => {
  // Pinned behaviour (design §3): "frozen" is NOT "preview", so the gate falls
  // through to the plain arithmetic — a past edition renders without a flag.
  // Fail-closed means "never FETCH", not "never render": the pages must keep
  // serving, from the archive.
  it("loads a frozen PAST edition regardless of the flag", () => {
    expect(resolveEditionLoadable("frozen", 2026, CURRENT, false)).toBe(true);
  });

  it("gates a frozen FUTURE edition on the flag, like any non-preview edition", () => {
    expect(resolveEditionLoadable("frozen", 2027, CURRENT, false)).toBe(false);
    expect(resolveEditionLoadable("frozen", 2027, CURRENT, true)).toBe(true);
  });
});
