/**
 * SPKR-04 — unit coverage for the pure helpers in src/lib/speakers.ts.
 *
 * Phase 13 wholesale replacement (D-09): the previous file mocked a non-existent
 * `talks` astro collection and imported a deleted `getLocale` export, leaving 6
 * ts(2345) / ts(2305) errors under pnpm astro check. This rewrite covers only
 * the three pure exports (no mocks needed) and inlines the D-06 undefined-safety
 * cases that Plan 13-01 Task 1 appended temporarily.
 *
 * Not covered here (exercised by build-output tests in tests/build/):
 *   getAllSpeakers, getSpeakersByLocale, getTalksByLocale,
 *   getTalksForSpeaker, getSortedSpeakers — they require the live content collection.
 */

import { describe, it, expect, vi } from "vitest";

// The speakers module imports astro:content for getCollection, but the three
// helpers under test are pure and never touch it. Stub the specifier so Node
// can resolve the import graph without the Astro runtime.
vi.mock("astro:content", () => ({
  // Any per-year collection name returns empty; only pure helpers are tested here.
  getCollection: async (_name: string) => [],
}));

import {
  getSlug,
  getCoSpeakersForTalk,
  getPrimaryTalk,
} from "../speakers";
import type { SessionRow } from "../schedule";

function makeSession(overrides: Partial<SessionRow>): SessionRow {
  return {
    id: "s",
    title: "t",
    speakers: [],
    track: "",
    level: "",
    room: "",
    format: "talk",
    startTime: "2027-06-03T09:00:00+02:00",
    durationMin: 30,
    tags: [],
    feedbackUrl: "",
    slidesUrl: "",
    recordingUrl: "",
    coverImageUrl: "",
    language: "",
    status: "confirmed",
    description: "",
    ...overrides,
  };
}

describe("getSlug", () => {
  it("returns the entry id verbatim", () => {
    expect(getSlug("petazzoni")).toBe("petazzoni");
  });
});

describe("getCoSpeakersForTalk", () => {
  it("filters out the current speaker", () => {
    const session = makeSession({ speakers: ["a", "b", "c"] });
    expect(getCoSpeakersForTalk(session, "b")).toEqual(["a", "c"]);
  });

  it("returns [] when session.speakers is undefined (D-06)", () => {
    const session = makeSession({ speakers: undefined as unknown as string[] });
    expect(() => getCoSpeakersForTalk(session, "anybody")).not.toThrow();
    expect(getCoSpeakersForTalk(session, "anybody")).toEqual([]);
  });

  it("returns [] when session.speakers is null (D-06)", () => {
    const session = makeSession({ speakers: null as unknown as string[] });
    expect(() => getCoSpeakersForTalk(session, "anybody")).not.toThrow();
    expect(getCoSpeakersForTalk(session, "anybody")).toEqual([]);
  });
});

describe("getPrimaryTalk", () => {
  it("picks the keynote over a regular talk (D-04)", () => {
    const keynote = makeSession({ id: "k", format: "keynote", speakers: ["x"], startTime: "2027-06-03T14:00:00+02:00" });
    const talk = makeSession({ id: "t", format: "talk", speakers: ["x"], startTime: "2027-06-03T09:00:00+02:00" });
    expect(getPrimaryTalk("x", [talk, keynote])?.id).toBe("k");
  });

  it("picks the earliest startTime among non-keynotes (D-04 tiebreak)", () => {
    const late = makeSession({ id: "late", speakers: ["y"], startTime: "2027-06-03T15:00:00+02:00" });
    const early = makeSession({ id: "early", speakers: ["y"], startTime: "2027-06-03T09:00:00+02:00" });
    expect(getPrimaryTalk("y", [late, early])?.id).toBe("early");
  });

  it("returns undefined when the speaker has no sessions (D-05)", () => {
    const session = makeSession({ speakers: ["someone-else"] });
    expect(getPrimaryTalk("missing", [session])).toBeUndefined();
  });
});
