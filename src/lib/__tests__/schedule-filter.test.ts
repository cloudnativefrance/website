import { describe, it, expect } from "vitest";
import {
  emptyFilterState,
  matchesSession,
  activeFilterCount,
  groupIntoSlots,
  findGaps,
} from "../schedule-filter";
import type { SessionRow } from "../schedule";

function row(over: Partial<SessionRow> = {}): SessionRow {
  return {
    id: "AAA111",
    title: "Scaler vos charges de travail GPU",
    speakers: ["amine-saboni"],
    track: "IA et Data",
    level: "intermediate",
    room: "Debussy",
    format: "talk",
    startTime: "2026-02-03T11:15:00+01:00",
    durationMin: 45,
    tags: [],
    feedbackUrl: "",
    slidesUrl: "",
    recordingUrl: "",
    coverImageUrl: "",
    language: "fr",
    status: "confirmed",
    description: "Karpenter et Argo Workflows",
    ...over,
  };
}

describe("matchesSession — filters", () => {
  it("matches everything when no filter is set", () => {
    expect(matchesSession(row(), emptyFilterState())).toBe(true);
  });

  it("narrows by room", () => {
    const s = { ...emptyFilterState(), room: new Set(["Monet"]) };
    expect(matchesSession(row({ room: "Monet" }), s)).toBe(true);
    expect(matchesSession(row({ room: "Piaf" }), s)).toBe(false);
  });

  it("keeps a keynote visible whatever the room filter", () => {
    // A keynote spans every room, so hiding it because one room is deselected
    // would drop the session the whole audience attends.
    const s = { ...emptyFilterState(), room: new Set(["Dumas"]) };
    expect(matchesSession(row({ room: "Monet", format: "keynote" }), s)).toBe(true);
  });

  it("treats multiple values in one facet as OR", () => {
    const s = { ...emptyFilterState(), room: new Set(["Monet", "Piaf"]) };
    expect(matchesSession(row({ room: "Piaf" }), s)).toBe(true);
  });

  it("treats different facets as AND", () => {
    const s = {
      ...emptyFilterState(),
      room: new Set(["Monet"]),
      format: new Set(["lightning"]),
    };
    expect(matchesSession(row({ room: "Monet", format: "talk" }), s)).toBe(false);
    expect(matchesSession(row({ room: "Monet", format: "lightning" }), s)).toBe(true);
  });
});

describe("matchesSession — search", () => {
  it("matches the title, case- and accent-insensitively", () => {
    const s = { ...emptyFilterState(), query: "SCALER" };
    expect(matchesSession(row(), s)).toBe(true);
  });

  it("ignores accents in both the query and the text", () => {
    // A visitor typing "securite" must find "Réseau et sécurité".
    const s = { ...emptyFilterState(), query: "securite" };
    expect(matchesSession(row({ track: "Réseau et sécurité" }), s)).toBe(true);
  });

  it("matches the description", () => {
    const s = { ...emptyFilterState(), query: "karpenter" };
    expect(matchesSession(row(), s)).toBe(true);
  });

  it("matches a speaker's display name, not just their slug", () => {
    // Cards show "Amine Saboni"; searching that must work even though the row
    // only stores the slug.
    const s = { ...emptyFilterState(), query: "saboni" };
    expect(matchesSession(row(), s, ["Amine Saboni"])).toBe(true);
  });

  it("combines with facets as AND", () => {
    const s = { ...emptyFilterState(), query: "gpu", room: new Set(["Monet"]) };
    expect(matchesSession(row({ room: "Debussy" }), s)).toBe(false);
  });

  it("ignores surrounding whitespace and an empty query", () => {
    expect(matchesSession(row(), { ...emptyFilterState(), query: "   " })).toBe(true);
  });
});

describe("activeFilterCount", () => {
  it("counts selected values across facets, and the query as one", () => {
    const s = {
      ...emptyFilterState(),
      room: new Set(["Monet", "Piaf"]),
      level: new Set(["advanced"]),
      query: "cilium",
    };
    expect(activeFilterCount(s)).toBe(4);
  });

  it("is zero for an untouched state", () => {
    expect(activeFilterCount(emptyFilterState())).toBe(0);
  });
});

describe("groupIntoSlots", () => {
  it("groups sessions sharing a start time, in chronological order", () => {
    const slots = groupIntoSlots([
      row({ id: "B", startTime: "2026-02-03T11:15:00+01:00", room: "Piaf" }),
      row({ id: "A", startTime: "2026-02-03T09:00:00+01:00", room: "Monet" }),
      row({ id: "C", startTime: "2026-02-03T11:15:00+01:00", room: "Debussy" }),
    ]);
    expect(slots.map((s) => s.startTime)).toEqual([
      "2026-02-03T09:00:00+01:00",
      "2026-02-03T11:15:00+01:00",
    ]);
    expect(slots[1].sessions.map((s) => s.id)).toEqual(["B", "C"]);
  });

  it("returns an empty array for no sessions", () => {
    expect(groupIntoSlots([])).toEqual([]);
  });
});

describe("findGaps", () => {
  it("reports a lunch-sized gap between slots", () => {
    const slots = groupIntoSlots([
      row({ id: "A", startTime: "2026-02-03T12:00:00+01:00", durationMin: 10 }),
      row({ id: "B", startTime: "2026-02-03T13:00:00+01:00", durationMin: 30 }),
    ]);
    const gaps = findGaps(slots);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]).toMatchObject({
      afterSlotIndex: 0,
      startTime: "12:10",
      endTime: "13:00",
      minutes: 50,
    });
  });

  it("ignores a changeover shorter than the threshold", () => {
    const slots = groupIntoSlots([
      row({ id: "A", startTime: "2026-02-03T10:30:00+01:00", durationMin: 45 }),
      row({ id: "B", startTime: "2026-02-03T11:30:00+01:00", durationMin: 30 }),
    ]);
    // 15 minutes between talks is a corridor change, not a break worth labelling.
    expect(findGaps(slots, 20)).toEqual([]);
  });

  it("measures the gap from the LATEST end in the slot, not the first", () => {
    // A slot holds parallel talks of different lengths: a 10-minute lightning
    // talk alongside a 45-minute one. Measuring from the FIRST session's end
    // (10:40) would report a 50-minute break while the long talk is still
    // running until 11:15 — a break the site would then label on screen.
    // Measured correctly there are only 15 minutes, below the threshold, so
    // nothing is reported. This asserts the absence, because that is exactly
    // what the naive implementation gets wrong.
    const slots = groupIntoSlots([
      row({ id: "SHORT", startTime: "2026-02-03T10:30:00+01:00", durationMin: 10 }),
      row({ id: "LONG", startTime: "2026-02-03T10:30:00+01:00", durationMin: 45, room: "Piaf" }),
      row({ id: "NEXT", startTime: "2026-02-03T11:30:00+01:00", durationMin: 30 }),
    ]);
    expect(findGaps(slots, 20)).toEqual([]);
  });

  it("does report the gap once the long talk has finished", () => {
    // Same slot, but the next one starts at 11:50: 35 minutes after 11:15.
    const slots = groupIntoSlots([
      row({ id: "SHORT", startTime: "2026-02-03T10:30:00+01:00", durationMin: 10 }),
      row({ id: "LONG", startTime: "2026-02-03T10:30:00+01:00", durationMin: 45, room: "Piaf" }),
      row({ id: "NEXT", startTime: "2026-02-03T11:50:00+01:00", durationMin: 30 }),
    ]);
    const gaps = findGaps(slots, 20);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]).toMatchObject({ startTime: "11:15", endTime: "11:50", minutes: 35 });
  });
});
