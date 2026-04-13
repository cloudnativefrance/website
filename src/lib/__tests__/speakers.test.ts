/**
 * SPKR-04: Unit tests for speaker/talk utility functions in src/lib/speakers.ts
 *
 * Tests verify the observable behavior of all 7 exported utility functions:
 * getSlug, getLocale, getSpeakersByLocale, getTalksByLocale,
 * getTalksForSpeaker, getSortedSpeakers, getCoSpeakersForTalk
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Fixtures — minimal shape matching Astro collection entry structure
// ---------------------------------------------------------------------------

const frSpeakers = [
  { id: "fr/speaker-1", data: { name: "Marie Laurent", company: "CloudScale" } },
  { id: "fr/speaker-2", data: { name: "Thomas Nguyen", company: "KubeForge" } },
  { id: "fr/speaker-3", data: { name: "Sarah Chen", company: "Observia" } },
  { id: "fr/speaker-4", data: { name: "Lucas Martin", company: "SecureOps" } },
  { id: "fr/speaker-5", data: { name: "Amina Diallo", company: "ContainerLab" } },
  { id: "fr/speaker-6", data: { name: "David Moreau", company: "PlatformHQ" } },
];

const enSpeakers = frSpeakers.map((s) => ({
  ...s,
  id: s.id.replace("fr/", "en/"),
}));

const allSpeakers = [...frSpeakers, ...enSpeakers];

const frTalks = [
  {
    id: "fr/talk-1",
    data: { title: "Keynote 1", speaker: "speaker-1", track: "devops-platform", format: "keynote", duration: 45 },
  },
  {
    id: "fr/talk-2",
    data: { title: "Keynote 2", speaker: "speaker-2", track: "devops-platform", format: "keynote", duration: 40 },
  },
  {
    id: "fr/talk-3",
    data: { title: "OpenTelemetry", speaker: "speaker-3", track: "cloud-infra", format: "talk", duration: 30 },
  },
  {
    id: "fr/talk-4",
    data: { title: "Zero Trust", speaker: "speaker-4", track: "security", format: "talk", duration: 45 },
  },
  {
    id: "fr/talk-5",
    data: {
      title: "CI/CD cloud-native",
      speaker: "speaker-5",
      cospeakers: ["speaker-6"],
      track: "devops-platform",
      format: "talk",
      duration: 45,
    },
  },
  {
    id: "fr/talk-6",
    data: { title: "eBPF Security", speaker: "speaker-4", track: "security", format: "lightning", duration: 15 },
  },
  {
    id: "fr/talk-7",
    data: { title: "CNCF France", speaker: "speaker-5", track: "community", format: "talk", duration: 30 },
  },
  {
    id: "fr/talk-8",
    data: { title: "Multi-cloud K8s", speaker: "speaker-3", track: "cloud-infra", format: "workshop", duration: 120 },
  },
];

const enTalks = frTalks.map((t) => ({
  ...t,
  id: t.id.replace("fr/", "en/"),
}));

const allTalks = [...frTalks, ...enTalks];

// ---------------------------------------------------------------------------
// Mock astro:content so the module can be imported in a plain Node context
// ---------------------------------------------------------------------------

vi.mock("astro:content", () => ({
  getCollection: vi.fn(),
}));

// We also need to mock @/i18n/ui because vitest resolves the alias but the
// module itself uses `as const` which is fine — we just re-export the type.
// No mock needed for pure TS imports.

// ---------------------------------------------------------------------------
// Import after mocks are declared (vitest hoists vi.mock calls)
// ---------------------------------------------------------------------------
import { getCollection } from "astro:content";
import {
  getSlug,
  getLocale,
  getSpeakersByLocale,
  getTalksByLocale,
  getTalksForSpeaker,
  getSortedSpeakers,
  getCoSpeakersForTalk,
} from "../speakers";

const mockGetCollection = vi.mocked(getCollection);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getSlug
// ---------------------------------------------------------------------------

describe("getSlug", () => {
  it("strips the fr/ locale prefix from an entry ID", () => {
    expect(getSlug("fr/speaker-1")).toBe("speaker-1");
  });

  it("strips the en/ locale prefix from an entry ID", () => {
    expect(getSlug("en/speaker-3")).toBe("speaker-3");
  });

  it("returns a slug unchanged when it has no locale prefix", () => {
    expect(getSlug("speaker-5")).toBe("speaker-5");
  });
});

// ---------------------------------------------------------------------------
// getLocale
// ---------------------------------------------------------------------------

describe("getLocale", () => {
  it("returns en for an entry ID starting with en/", () => {
    expect(getLocale("en/speaker-2")).toBe("en");
  });

  it("returns fr for an entry ID starting with fr/", () => {
    expect(getLocale("fr/speaker-4")).toBe("fr");
  });

  it("defaults to fr when no recognisable prefix is present", () => {
    expect(getLocale("speaker-1")).toBe("fr");
  });
});

// ---------------------------------------------------------------------------
// getSpeakersByLocale
// ---------------------------------------------------------------------------

describe("getSpeakersByLocale", () => {
  it("returns only FR speakers when locale is fr", async () => {
    mockGetCollection.mockResolvedValue(allSpeakers as any);
    const result = await getSpeakersByLocale("fr");
    expect(result).toHaveLength(6);
    expect(result.every((s) => s.id.startsWith("fr/"))).toBe(true);
  });

  it("returns only EN speakers when locale is en", async () => {
    mockGetCollection.mockResolvedValue(allSpeakers as any);
    const result = await getSpeakersByLocale("en");
    expect(result).toHaveLength(6);
    expect(result.every((s) => s.id.startsWith("en/"))).toBe(true);
  });

  it("queries the speakers collection", async () => {
    mockGetCollection.mockResolvedValue([] as any);
    await getSpeakersByLocale("fr");
    expect(mockGetCollection).toHaveBeenCalledWith("speakers");
  });
});

// ---------------------------------------------------------------------------
// getTalksByLocale
// ---------------------------------------------------------------------------

describe("getTalksByLocale", () => {
  it("returns only FR talks when locale is fr", async () => {
    mockGetCollection.mockResolvedValue(allTalks as any);
    const result = await getTalksByLocale("fr");
    expect(result).toHaveLength(8);
    expect(result.every((t) => t.id.startsWith("fr/"))).toBe(true);
  });

  it("returns only EN talks when locale is en", async () => {
    mockGetCollection.mockResolvedValue(allTalks as any);
    const result = await getTalksByLocale("en");
    expect(result).toHaveLength(8);
    expect(result.every((t) => t.id.startsWith("en/"))).toBe(true);
  });

  it("queries the talks collection", async () => {
    mockGetCollection.mockResolvedValue([] as any);
    await getTalksByLocale("fr");
    expect(mockGetCollection).toHaveBeenCalledWith("talks");
  });
});

// ---------------------------------------------------------------------------
// getTalksForSpeaker
// ---------------------------------------------------------------------------

describe("getTalksForSpeaker", () => {
  it("returns talks where the speaker is the primary presenter", async () => {
    mockGetCollection.mockResolvedValue(allTalks as any);
    // speaker-4 is primary on talk-4 and talk-6
    const result = await getTalksForSpeaker("fr", "speaker-4");
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toContain("fr/talk-4");
    expect(result.map((t) => t.id)).toContain("fr/talk-6");
  });

  it("returns talks where the speaker appears as a co-speaker", async () => {
    mockGetCollection.mockResolvedValue(allTalks as any);
    // speaker-6 is a cospeaker on talk-5
    const result = await getTalksForSpeaker("fr", "speaker-6");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fr/talk-5");
  });

  it("returns empty array when speaker has no talks in the given locale", async () => {
    mockGetCollection.mockResolvedValue(allTalks as any);
    const result = await getTalksForSpeaker("fr", "speaker-99");
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getSortedSpeakers — keynote-first ordering (SPKR-01 data contract)
// ---------------------------------------------------------------------------

describe("getSortedSpeakers", () => {
  beforeEach(() => {
    // Alternate calls: first call returns speakers, second returns talks
    mockGetCollection
      .mockResolvedValueOnce(allSpeakers as any)
      .mockResolvedValueOnce(allTalks as any);
  });

  it("places keynote speakers before non-keynote speakers", async () => {
    const result = await getSortedSpeakers("fr");
    // speaker-1 and speaker-2 are keynote speakers; they must appear in positions 0 and 1
    const keynoteSlugs = new Set(["speaker-1", "speaker-2"]);
    const firstTwo = result.slice(0, 2).map((s) => getSlug(s.id));
    expect(new Set(firstTwo)).toEqual(keynoteSlugs);
  });

  it("sorts non-keynote speakers alphabetically by name after keynotes", async () => {
    const result = await getSortedSpeakers("fr");
    const nonKeynotes = result.slice(2).map((s) => s.data.name);
    const sorted = [...nonKeynotes].sort((a, b) => a.localeCompare(b));
    expect(nonKeynotes).toEqual(sorted);
  });

  it("returns all 6 FR speakers", async () => {
    const result = await getSortedSpeakers("fr");
    expect(result).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// getCoSpeakersForTalk
// ---------------------------------------------------------------------------

describe("getCoSpeakersForTalk", () => {
  it("returns the primary speaker when called from a co-speaker perspective", () => {
    const talk = frTalks.find((t) => t.id === "fr/talk-5")!;
    // From speaker-6's perspective, the other participant is speaker-5 (primary)
    const result = getCoSpeakersForTalk(talk, "speaker-6");
    expect(result).toEqual(["speaker-5"]);
  });

  it("returns the co-speaker when called from the primary speaker perspective", () => {
    const talk = frTalks.find((t) => t.id === "fr/talk-5")!;
    // From speaker-5's perspective, the other participant is speaker-6 (cospeaker)
    const result = getCoSpeakersForTalk(talk, "speaker-5");
    expect(result).toEqual(["speaker-6"]);
  });

  it("returns empty array for a solo talk", () => {
    const talk = frTalks.find((t) => t.id === "fr/talk-1")!;
    // talk-1 has no cospeakers — primary speaker is excluded, result is empty
    const result = getCoSpeakersForTalk(talk, "speaker-1");
    expect(result).toEqual([]);
  });

  it("bidirectional: speaker-5 profile sees speaker-6, and speaker-6 profile sees speaker-5", () => {
    const talk = frTalks.find((t) => t.id === "fr/talk-5")!;
    const fromSpeaker5 = getCoSpeakersForTalk(talk, "speaker-5");
    const fromSpeaker6 = getCoSpeakersForTalk(talk, "speaker-6");
    expect(fromSpeaker5).toContain("speaker-6");
    expect(fromSpeaker6).toContain("speaker-5");
  });
});

describe("getCoSpeakersForTalk D-06 undefined-safety", () => {
  it("returns [] when session.speakers is undefined (D-06)", () => {
    const session = { id: "x", title: "t", speakers: undefined, track: "", startTime: "" } as any;
    expect(() => getCoSpeakersForTalk(session, "anybody")).not.toThrow();
    expect(getCoSpeakersForTalk(session, "anybody")).toEqual([]);
  });

  it("returns [] when session.speakers is null (D-06)", () => {
    const session = { id: "x", title: "t", speakers: null, track: "", startTime: "" } as any;
    expect(() => getCoSpeakersForTalk(session, "anybody")).not.toThrow();
    expect(getCoSpeakersForTalk(session, "anybody")).toEqual([]);
  });
});
