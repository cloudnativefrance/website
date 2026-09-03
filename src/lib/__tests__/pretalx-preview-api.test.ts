import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  localised,
  fetchWipScheduleId,
  fetchPreviewSlots,
} from "@/lib/pretalx-preview-api";

const TOKEN = "t0ken";
let calls: string[] = [];

function jsonOnce(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  calls = [];
});
afterEach(() => vi.unstubAllGlobals());

describe("localised", () => {
  it("prefers fr", () =>
    expect(localised({ fr: "Monet", en: "Monet EN" })).toBe("Monet"));
  it("falls back to the first present value", () =>
    expect(localised({ en: "Only English" })).toBe("Only English"));
  it("passes a plain string through", () =>
    expect(localised("Piaf")).toBe("Piaf"));
  it("returns empty for null/undefined/empty", () => {
    expect(localised(null)).toBe("");
    expect(localised(undefined)).toBe("");
    expect(localised({})).toBe("");
  });
});

describe("fetchWipScheduleId", () => {
  it("returns the version whose published is null", async () => {
    vi.stubGlobal("fetch", (u: string) => {
      calls.push(u);
      return jsonOnce({
        count: 2,
        next: null,
        results: [
          { id: 9, version: "v1.0", published: "2025-06-22T09:57:42+02:00" },
          { id: 12, version: "wip", published: null },
        ],
      });
    });
    await expect(fetchWipScheduleId("democon", TOKEN)).resolves.toBe(12);
  });

  it("THROWS when every version is published — never falls back to a release", async () => {
    vi.stubGlobal("fetch", () =>
      jsonOnce({
        count: 1,
        next: null,
        results: [
          { id: 9, version: "v1.0", published: "2025-06-22T09:57:42+02:00" },
        ],
      }),
    );
    await expect(fetchWipScheduleId("democon", TOKEN)).rejects.toThrow(
      /unpublished/i,
    );
  });
});

describe("fetchPreviewSlots", () => {
  it("pins the request to the given schedule id", async () => {
    vi.stubGlobal("fetch", (u: string) => {
      calls.push(u);
      return jsonOnce({ count: 0, next: null, results: [] });
    });
    await fetchPreviewSlots("democon", 12, TOKEN);
    expect(calls[0]).toContain("schedule=12");
  });

  it("follows pagination, re-anchoring the next link onto the configured origin", async () => {
    let page = 0;
    vi.stubGlobal("fetch", (u: string) => {
      calls.push(u);
      page += 1;
      return page === 1
        ? jsonOnce({
            count: 2,
            next: "http://cfp.cloudnativedays.fr/api/events/democon/slots/?page=2",
            results: [
              {
                id: 1,
                submission: "AAA",
                room: 1,
                start: "s",
                end: "e",
                duration: 30,
                is_visible: true,
                schedule: 12,
              },
            ],
          })
        : jsonOnce({
            count: 2,
            next: null,
            results: [
              {
                id: 2,
                submission: "BBB",
                room: 1,
                start: "s",
                end: "e",
                duration: 30,
                is_visible: true,
                schedule: 12,
              },
            ],
          });
    });
    const slots = await fetchPreviewSlots("democon", 12, TOKEN);
    expect(slots.map((s) => s.submission)).toEqual(["AAA", "BBB"]);
    expect(calls).toHaveLength(2);
  });
});
