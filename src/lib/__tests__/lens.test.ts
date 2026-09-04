import { describe, it, expect } from "vitest";
import { resolveLens, type LensCard } from "@/lib/lens";

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
