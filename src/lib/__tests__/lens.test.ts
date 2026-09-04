import { describe, it, expect } from "vitest";
import { resolveLens, countMatchesOutsideLens, lensTotal, type LensCard } from "@/lib/lens";

const ROOMS = ["Monet", "Piaf", "Eiffel"];
const cards: LensCard[] = [
  { id: "A", room: "Monet",  format: "talk",    audience: "tech" },
  { id: "B", room: "Eiffel", format: "talk",    audience: "leadership" },
  { id: "K", room: "",       format: "keynote", audience: "tech" },
];

describe("resolveLens", () => {
  it("hides cards outside the lens", () => {
    const r = resolveLens(cards, ROOMS, "tech");
    expect(r.hiddenIds.has("B")).toBe(true);
    expect(r.hiddenIds.has("A")).toBe(false);
  });

  it("keeps an all-room keynote visible in BOTH lenses", () => {
    for (const lens of ["tech", "leadership"] as const) {
      expect(resolveLens(cards, ROOMS, lens).hiddenIds.has("K")).toBe(false);
    }
  });

  it("hides a room with nothing in the lens", () => {
    const r = resolveLens(cards, ROOMS, "tech");
    expect(r.hiddenRooms.has("Eiffel")).toBe(true);
    expect(r.hiddenRooms.has("Piaf")).toBe(true);   // empty in every lens
    expect(r.hiddenRooms.has("Monet")).toBe(false);
  });

  it("counts the rooms that remain, which is what widens the columns", () => {
    expect(resolveLens(cards, ROOMS, "tech").roomCount).toBe(1);
    expect(resolveLens(cards, ROOMS, "leadership").roomCount).toBe(1);
  });

  it("renumbers the surviving rooms from 1, keeping their original order", () => {
    const wide: LensCard[] = [
      { id: "a", room: "Monet",  format: "talk", audience: "tech" },
      { id: "b", room: "Eiffel", format: "talk", audience: "tech" },
    ];
    // Piaf sits BETWEEN them in ROOMS and drops out, so Eiffel must move from
    // column 3 to column 2. Without this the grid pins it to a track that no
    // longer exists.
    const r = resolveLens(wide, ROOMS, "tech");
    expect(r.columnOf.get("Monet")).toBe(1);
    expect(r.columnOf.get("Eiffel")).toBe(2);
    expect(r.columnOf.has("Piaf")).toBe(false);
  });

  it("never reports zero rooms — a grid with no columns has no layout", () => {
    expect(resolveLens([], ROOMS, "tech").roomCount).toBe(1);
  });

  it("says nothing about break bands — they belong to both lenses", () => {
    const r = resolveLens(cards, ROOMS, "leadership");
    expect(r.hiddenIds.has("K")).toBe(false);
    // Kept in sync with LensResult's actual shape (see the "Produces"
    // interface and the DOM wrapper, both of which need `columnOf`) rather
    // than the brief's Step 1 literal, which omits it and would fail against
    // any implementation the DOM wrapper can consume.
    expect(Object.keys(r)).toEqual(["hiddenIds", "hiddenRooms", "columnOf", "roomCount"]);
  });
});

const haystack = [
  { id: "a", format: "talk",    audience: "tech" as const,       search: "ebpf réseau" },
  { id: "b", format: "talk",    audience: "leadership" as const, search: "gouvernance cloud" },
  { id: "c", format: "talk",    audience: "leadership" as const, search: "gouvernance et budget" },
  { id: "k", format: "keynote", audience: "tech" as const,       search: "gouvernance ouverture" },
];

describe("countMatchesOutsideLens", () => {
  it("counts matches in the other lens", () => {
    expect(countMatchesOutsideLens(haystack, "tech", "gouvernance")).toBe(2);
  });

  it("is zero when the other lens has nothing", () => {
    expect(countMatchesOutsideLens(haystack, "tech", "ebpf")).toBe(0);
  });

  it("is zero for an empty query — an empty search is not a search", () => {
    expect(countMatchesOutsideLens(haystack, "tech", "   ")).toBe(0);
  });

  it("ignores accents and case, like the main search", () => {
    expect(countMatchesOutsideLens(haystack, "tech", "GOUVERNANCE")).toBe(2);
    expect(countMatchesOutsideLens(haystack, "leadership", "RESEAU")).toBe(1);
  });

  it("counts each session once even though every card renders twice", () => {
    expect(countMatchesOutsideLens([...haystack, ...haystack], "tech", "gouvernance")).toBe(2);
  });

  it("never counts a keynote — it is already on screen in this lens", () => {
    expect(countMatchesOutsideLens(haystack, "leadership", "gouvernance")).toBe(0);
  });
});

describe("lensTotal", () => {
  it("counts each session once even though every card renders twice", () => {
    const twice = [...cards, ...cards];   // grid copy + list copy
    expect(lensTotal(twice, "tech")).toBe(lensTotal(cards, "tech"));
  });

  it("counts a keynote in both lenses", () => {
    expect(lensTotal(cards, "leadership")).toBe(2);   // K + B
    expect(lensTotal(cards, "tech")).toBe(2);         // K + A
  });
});

import { findClashes } from "@/lib/lens";

const s = (id: string, start: string, duration: number) => ({ id, start, duration });

describe("findClashes", () => {
  it("finds an overlap across lenses", () => {
    const c = findClashes([
      s("A", "2027-06-03T10:00:00+02:00", 45),
      s("B", "2027-06-03T10:30:00+02:00", 30),
    ]);
    expect(c.get("A")).toEqual(["B"]);
    expect(c.get("B")).toEqual(["A"]);
  });

  it("does not flag back-to-back sessions — touching is not overlapping", () => {
    const c = findClashes([
      s("A", "2027-06-03T10:00:00+02:00", 30),
      s("B", "2027-06-03T10:30:00+02:00", 30),
    ]);
    expect(c.size).toBe(0);
  });

  it("handles three-way overlaps", () => {
    const c = findClashes([
      s("A", "2027-06-03T10:00:00+02:00", 60),
      s("B", "2027-06-03T10:15:00+02:00", 15),
      s("C", "2027-06-03T10:30:00+02:00", 15),
    ]);
    expect(c.get("A")!.sort()).toEqual(["B", "C"]);
  });

  it("is empty for a single session", () => {
    expect(findClashes([s("A", "2027-06-03T10:00:00+02:00", 30)]).size).toBe(0);
  });

  it("dedupes by id — a session rendered twice (grid + list) does not clash with its own twin", () => {
    const a = s("A", "2027-06-03T10:00:00+02:00", 45);
    const c = findClashes([a, { ...a }]);
    expect(c.size).toBe(0);
  });

  it("degrades safely for a missing or unparseable start — it participates in no clashes", () => {
    const c = findClashes([
      s("A", "", 45),
      s("B", "2027-06-03T10:00:00+02:00", 45),
    ]);
    expect(c.size).toBe(0);
  });
});

import { facetValuesInLens, type FacetCard } from "@/lib/lens";

const mixed: FacetCard[] = [
  { audience: "tech",       room: "Monet",  format: "talk",    track: "IA et Data",           level: "intermediate" },
  { audience: "tech",       room: "Piaf",   format: "workshop", track: "Developer Experience", level: "" },
  { audience: "leadership", room: "Eiffel", format: "talk",    track: "Strategy & Leadership", level: "" },
  { audience: "tech",       room: "Monet",  format: "keynote", track: "",                     level: "" },
];

describe("facetValuesInLens", () => {
  it("keeps only the values the lens can still reach", () => {
    const v = facetValuesInLens(mixed, "leadership");
    expect([...v.room]).toEqual(["Eiffel"]);
    expect([...v.track]).toEqual(["Strategy & Leadership"]);
  });

  it("counts a keynote in every lens, since it is shown in both", () => {
    // The keynote is `audience: "tech"` by its (empty) track, but it spans the
    // whole audience — so "keynote" must stay offered in the leadership lens.
    expect(facetValuesInLens(mixed, "leadership").format.has("keynote")).toBe(true);
  });

  it("does not let a keynote's room into the room facet", () => {
    // The room filter already exempts keynotes (`schedule-filter.ts:52`), so
    // offering Monet in a lens whose only Monet session is the keynote would be
    // a control that changes nothing.
    expect(facetValuesInLens(mixed, "leadership").room.has("Monet")).toBe(false);
  });

  it("drops empty values — an unset level is not a level", () => {
    expect(facetValuesInLens(mixed, "tech").level.has("")).toBe(false);
    expect([...facetValuesInLens(mixed, "tech").level]).toEqual(["intermediate"]);
  });
});
