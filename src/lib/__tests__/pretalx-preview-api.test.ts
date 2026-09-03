import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  localised,
  fetchWipScheduleId,
  fetchPreviewSlots,
  fetchPreviewSpeakers,
  fetchPreviewSubmissions,
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
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

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

/**
 * The PII path every earlier review walked past.
 *
 * `/speakers/` returns `email` and `internal_notes`. A `res.json() as T` keeps
 * both in the heap for the whole build, and a `res.json()` that REJECTS does
 * worse: V8's SyntaxError quotes the body text it choked on, and that message
 * used to be printed verbatim into the build log by the retry warning. A
 * staging build log is not a place for a real person's email address.
 */
describe("the fetch boundary is where PII stops", () => {
  const SPEAKER_ROW = {
    code: "S1",
    name: "Ada Lovelace",
    biography: "Computing pioneer.",
    avatar_url: "https://cfp.cloudnativedays.fr/media/avatars/s1.jpg",
    answers: [{ question: { id: 15 }, answer: "Analytical Engines Ltd" }],
    email: "ada@example.com",
    internal_notes: "prefers the morning slot",
  };

  it("projects /speakers/ rows, so email and internal_notes never exist in memory", async () => {
    vi.stubGlobal("fetch", () =>
      jsonOnce({ count: 1, next: null, results: [SPEAKER_ROW] }),
    );
    const [speaker] = await fetchPreviewSpeakers("democon", TOKEN);
    expect(speaker).toEqual({
      code: "S1",
      name: "Ada Lovelace",
      biography: "Computing pioneer.",
      avatar_url: "https://cfp.cloudnativedays.fr/media/avatars/s1.jpg",
      answers: [{ question: { id: 15 }, answer: "Analytical Engines Ltd" }],
    });
    // toEqual would pass on a subset for arrays but not for object keys; assert
    // the absence explicitly so the intent survives a refactor of the matcher.
    expect(Object.keys(speaker!)).not.toContain("email");
    expect(Object.keys(speaker!)).not.toContain("internal_notes");
  });

  it("drops slot fields nothing reads rather than carrying them", async () => {
    vi.stubGlobal("fetch", () =>
      jsonOnce({
        count: 1,
        next: null,
        results: [
          {
            id: 1,
            submission: "AAA",
            room: 1,
            start: "2027-06-03T10:30:00+02:00",
            end: "2027-06-03T11:00:00+02:00",
            duration: 30,
            is_visible: true,
            schedule: 12,
          },
        ],
      }),
    );
    const [slot] = await fetchPreviewSlots("democon", 12, TOKEN);
    expect(slot).toEqual({
      submission: "AAA",
      room: 1,
      start: "2027-06-03T10:30:00+02:00",
      is_visible: true,
    });
  });

  it("re-throws a malformed body WITHOUT quoting it, and logs nothing from it", async () => {
    // A real V8 message: the parser embeds the surrounding body text, which for
    // this endpoint means an email address.
    const leak = JSON.stringify(SPEAKER_ROW);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", () =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.reject(
            new SyntaxError(
              `Unexpected end of JSON input while parsing near '{"results":[${leak}'`,
            ),
          ),
      }),
    );

    vi.useFakeTimers();
    const captured = fetchPreviewSpeakers("democon", TOKEN).catch(
      (err: unknown) => err,
    );
    await vi.advanceTimersByTimeAsync(60_000);
    const err = await captured;

    expect(err).toBeInstanceOf(Error);
    const message = (err as Error).message;
    expect(message).toMatch(/body withheld/);
    expect(message).toContain("speakers for democon");
    expect(message).toContain("HTTP 200");
    expect(message).not.toContain("ada@example.com");
    expect(message).not.toContain("internal_notes");

    // The retry warnings print messageOf(lastErr); they must be just as clean.
    const logged = warn.mock.calls.flat().join(" ");
    expect(logged).not.toContain("ada@example.com");
    expect(logged).not.toContain("internal_notes");
  });

  it("treats a results-less body the same way", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", () =>
      jsonOnce({ detail: "Invalid page.", email: "ada@example.com" }),
    );
    vi.useFakeTimers();
    const captured = fetchPreviewSlots("democon", 12, TOKEN).catch(
      (err: unknown) => err,
    );
    await vi.advanceTimersByTimeAsync(60_000);
    const err = await captured;
    expect((err as Error).message).toMatch(/body withheld/);
    expect((err as Error).message).not.toContain("ada@example.com");
    expect(warn.mock.calls.flat().join(" ")).not.toContain("ada@example.com");
  });
});

describe("fetchPreviewSubmissions", () => {
  it("asks only for confirmed proposals", async () => {
    // Spec D-2. Without it the walk pulls rejected and pending proposals into
    // memory, and a slotted-but-unconfirmed talk would render as a real one.
    vi.stubGlobal("fetch", (u: string) => {
      calls.push(u);
      return jsonOnce({ count: 0, next: null, results: [] });
    });
    await fetchPreviewSubmissions("democon", TOKEN);
    expect(calls[0]).toContain("state=confirmed");
    expect(calls[0]).toContain("expand=track,submission_type,speakers,answers.question");
  });
});
