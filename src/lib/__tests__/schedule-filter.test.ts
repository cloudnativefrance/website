import { describe, it, expect, vi } from "vitest";
import {
  emptyFilterState,
  matchesSession,
  activeFilterCount,
  groupIntoSlots,
  buildTimeGrid,
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

describe("buildTimeGrid", () => {
  it("spans a card from its own start to its own end", () => {
    // The defect this replaced: every card in a slot stretched to one shared
    // height, so a 10-minute lightning talk was as tall as a 45-minute talk
    // beside it and the rows below the long one looked empty in its column.
    const grid = buildTimeGrid([
      row({ id: "SHORT", startTime: "2026-02-03T10:30:00+01:00", durationMin: 10 }),
      row({ id: "LONG", startTime: "2026-02-03T10:30:00+01:00", durationMin: 45, room: "Piaf" }),
    ]);
    const short = grid.placements.find((p) => p.session.id === "SHORT")!;
    const long = grid.placements.find((p) => p.session.id === "LONG")!;
    // Boundaries are 10:30, 10:40, 11:15 -> lines 1, 2, 3.
    expect(short).toMatchObject({ rowStart: 1, rowEnd: 2 });
    expect(long).toMatchObject({ rowStart: 1, rowEnd: 3 });
    // The long talk must outlast the short one; equal spans is the old bug.
    expect(long.rowEnd - long.rowStart).toBeGreaterThan(short.rowEnd - short.rowStart);
  });

  it("gives a later session a line below one still running", () => {
    // A talk starting at 10:45 in another room must sit BELOW the 10:30 line,
    // not beside it, while the 10:30-11:15 talk is still going.
    const grid = buildTimeGrid([
      row({ id: "LONG", startTime: "2026-02-03T10:30:00+01:00", durationMin: 45 }),
      row({ id: "LATER", startTime: "2026-02-03T10:45:00+01:00", durationMin: 10, room: "Piaf" }),
    ]);
    const long = grid.placements.find((p) => p.session.id === "LONG")!;
    const later = grid.placements.find((p) => p.session.id === "LATER")!;
    expect(later.rowStart).toBeGreaterThan(long.rowStart);
    expect(later.rowStart).toBeLessThan(long.rowEnd);
  });


  it("is empty for no sessions", () => {
    expect(buildTimeGrid([])).toEqual({ rowCount: 0, placements: [], gaps: [] });
  });

  it("reports a lunch-sized gap", () => {
    const grid = buildTimeGrid([
      row({ id: "A", startTime: "2026-02-03T12:00:00+01:00", durationMin: 10 }),
      row({ id: "B", startTime: "2026-02-03T13:00:00+01:00", durationMin: 30 }),
    ]);
    expect(grid.gaps).toHaveLength(1);
    expect(grid.gaps[0]).toMatchObject({ startTime: "12:10", endTime: "13:00", minutes: 50 });
  });

  it("ignores a changeover shorter than the threshold", () => {
    const grid = buildTimeGrid([
      row({ id: "A", startTime: "2026-02-03T10:30:00+01:00", durationMin: 45 }),
      row({ id: "B", startTime: "2026-02-03T11:30:00+01:00", durationMin: 30 }),
    ]);
    // 15 minutes between talks is a corridor change, not a break worth labelling.
    expect(grid.gaps).toEqual([]);
  });

  it("does not invent a break while a parallel long talk is still running", () => {
    // A 10-minute lightning talk ends at 10:40 while a 45-minute talk beside it
    // runs to 11:15. Measuring from the FIRST end would report a 50-minute
    // break the site would then draw across the screen. Coverage-based
    // detection cannot: rows 10:40-11:15 are covered by the long talk.
    const grid = buildTimeGrid([
      row({ id: "SHORT", startTime: "2026-02-03T10:30:00+01:00", durationMin: 10 }),
      row({ id: "LONG", startTime: "2026-02-03T10:30:00+01:00", durationMin: 45, room: "Piaf" }),
      row({ id: "NEXT", startTime: "2026-02-03T11:30:00+01:00", durationMin: 30 }),
    ]);
    expect(grid.gaps).toEqual([]);
  });

  it("does report the gap once the long talk has finished", () => {
    const grid = buildTimeGrid([
      row({ id: "SHORT", startTime: "2026-02-03T10:30:00+01:00", durationMin: 10 }),
      row({ id: "LONG", startTime: "2026-02-03T10:30:00+01:00", durationMin: 45, room: "Piaf" }),
      row({ id: "NEXT", startTime: "2026-02-03T11:50:00+01:00", durationMin: 30 }),
    ]);
    expect(grid.gaps).toHaveLength(1);
    expect(grid.gaps[0]).toMatchObject({ startTime: "11:15", endTime: "11:50", minutes: 35 });
  });
});

describe("buildTimeGrid across days", () => {
  it("does not label the space between two days as a break", () => {
    // The gap between day 1 ending and day 2 starting is not a break in either
    // day. Left unbounded it rendered as "Pause déjeuner · 10:00 — 09:00",
    // because the label wraps to wall-clock and 1380 minutes reads as lunch.
    const grid = buildTimeGrid([
      row({ id: "D1", startTime: "2026-02-03T09:00:00+01:00", durationMin: 60 }),
      row({ id: "D2", startTime: "2026-02-04T09:00:00+01:00", durationMin: 60 }),
    ]);
    expect(grid.gaps).toEqual([]);
    // The placements themselves still order correctly across the boundary.
    const [d1, d2] = ["D1", "D2"].map((id) => grid.placements.find((p) => p.session.id === id)!);
    expect(d2.rowStart).toBeGreaterThanOrEqual(d1.rowEnd);
  });
});

describe("buildTimeGrid overlap detection", () => {
  it("warns when two sessions share a room and a time range", () => {
    // Same column, intersecting rows: the cards render stacked on top of each
    // other, which looks like a rendering bug rather than the double-booking
    // it actually is.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    buildTimeGrid([
      row({ id: "A", room: "Monet", startTime: "2026-02-03T10:00:00+01:00", durationMin: 60 }),
      row({ id: "B", room: "Monet", startTime: "2026-02-03T10:30:00+01:00", durationMin: 30 }),
    ]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("overlap in time"));
    warn.mockRestore();
  });

  it("stays quiet for parallel sessions in different rooms", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    buildTimeGrid([
      row({ id: "A", room: "Monet", startTime: "2026-02-03T10:00:00+01:00", durationMin: 60 }),
      row({ id: "B", room: "Piaf", startTime: "2026-02-03T10:00:00+01:00", durationMin: 60 }),
    ]);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
