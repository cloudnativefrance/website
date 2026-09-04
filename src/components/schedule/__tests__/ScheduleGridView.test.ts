// Pins the CSS Grid placement of `.grid-view-cell` elements — not merely
// their presence. A previous fix stopped a bug where a keynote's
// `.grid-view-span` (grid-column: 2 / -1) made sibling room cells vanish
// under auto-placement, but left every room cell's *column* to be inferred
// by the browser rather than set explicitly. When a slot mixes a keynote
// with room cells, CSS Grid auto-placement can't fit a cell after the span
// on row 1 and wraps to row 2 starting back at column 1 (the time gutter's
// column) instead of column 2 — every room cell then lands one column left
// of its room, silently. A grep for marker strings (the previous
// verification) can't catch this: the content is present, just in the
// wrong column. This test renders through Astro's container API and reads
// each cell's actual `grid-column`.
import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import ScheduleGridView from "../ScheduleGridView.astro";
import type { SessionRow } from "@/lib/schedule";

function row(over: Partial<SessionRow> = {}): SessionRow {
  return {
    id: "AAA111",
    title: "Test session",
    speakers: [],
    track: "",
    level: "",
    room: "Monet",
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
    description: "",
    ...over,
  };
}

/**
 * Split the rendered row into one HTML chunk per `.grid-view-cell`, keyed by
 * the `grid-column` value on its `style` attribute. Cells are flat siblings
 * in source order (`rooms.map`), so slicing the string between consecutive
 * cell-start markers isolates each cell's own subtree — good enough to check
 * "does this session id appear in this cell's region" without a full DOM
 * parser (none is a project dependency, and this project's other build
 * tests already assert on raw HTML/source strings the same way).
 *
 * `room` is read out of the matched opening tag itself, not the sliced
 * `html` region: `data-room` sits *inside* that tag (Astro renders
 * `class`, `data-room`, then `style` in source order), so slicing from the
 * end of the tag — which is what isolates a cell's children — excludes it.
 * Extracted with its own regex against the full match rather than assumed
 * to sit at a fixed offset from `style`, so this keeps working if the
 * attribute order in the component ever changes.
 */
interface Cell {
  html: string;
  room: string | undefined;
  rowStart: number;
  rowEnd: number;
}

function cellsByColumn(html: string): Map<number, Cell> {
  const starts = [
    ...html.matchAll(
      /<div class="grid-view-cell"[^>]*style="grid-column:(\d+); grid-row:(\d+) \/ (\d+);"[^>]*>/g,
    ),
  ];
  const cells = new Map<number, Cell>();
  for (let i = 0; i < starts.length; i++) {
    const from = starts[i].index! + starts[i][0].length;
    const to = i + 1 < starts.length ? starts[i + 1].index! : html.length;
    cells.set(Number(starts[i][1]), {
      html: html.slice(from, to),
      room: starts[i][0].match(/data-room="([^"]*)"/)?.[1],
      rowStart: Number(starts[i][2]),
      rowEnd: Number(starts[i][3]),
    });
  }
  return cells;
}

async function renderGrid(sessions: SessionRow[]) {
  const container = await AstroContainer.create();
  return container.renderToString(ScheduleGridView, {
    props: { sessions, lang: "fr", speakerInfo: new Map() },
  });
}

describe("ScheduleGridView — room cell placement", () => {
  it("gives each room cell the explicit column its room index implies, in a slot mixing a keynote and talks", async () => {
    // listRooms orders Monet, Piaf, Debussy per ROOM_ORDER — so room index
    // 0/1/2 must land in grid-column 2/3/4 (column 1 is the time gutter).
    const html = await renderGrid([
      row({ id: "KEYNOTE", format: "keynote", room: "Monet" }),
      row({ id: "TALK-PIAF", format: "talk", room: "Piaf" }),
      row({ id: "TALK-DEBUSSY", format: "talk", room: "Debussy" }),
    ]);

    const cells = cellsByColumn(html);
    // Monet's only session here is the keynote, which renders in the full-width
    // span instead — so no room cell is emitted for it. Under explicit
    // placement an empty cell is a grid item occupying a track for nothing.
    expect([...cells.keys()].sort()).toEqual([3, 4]);

    // The bug's exact symptom: a talk landing one column left of its room.
    // Room[1] (Piaf) must be in column 3, not smeared into column 2.
    expect(cells.get(3)!.html).toContain('data-session-id="TALK-PIAF"');

    // Room[2] (Debussy) must be in column 4, not column 3.
    expect(cells.get(4)!.html).toContain('data-session-id="TALK-DEBUSSY"');
    expect(cells.get(3)!.html).not.toContain('data-session-id="TALK-DEBUSSY"');

    // No room cell ever lands in the 56px time-gutter column.
    expect(cells.has(1)).toBe(false);
    expect(cells.has(2)).toBe(false);
  });

  it("keeps the same column per room index in a homogeneous (no-keynote) slot", async () => {
    // Today every real slot is homogeneous (keynote-only or non-keynote-only).
    // The explicit column must reproduce the same visual placement the old
    // implicit auto-placement gave these rows, room[i] -> column i + 2.
    const html = await renderGrid([
      row({ id: "A", format: "talk", room: "Monet" }),
      row({ id: "B", format: "talk", room: "Piaf" }),
      row({ id: "C", format: "talk", room: "Debussy" }),
    ]);

    const cells = cellsByColumn(html);
    expect(cells.get(2)!.html).toContain('data-session-id="A"');
    expect(cells.get(3)!.html).toContain('data-session-id="B"');
    expect(cells.get(4)!.html).toContain('data-session-id="C"');
  });

  it("spans each cell to its own end time, so duration is visible", async () => {
    // The whole point of the single-grid rewrite. Three parallel talks of
    // different lengths must occupy different numbers of row tracks; the old
    // per-slot grids stretched them all to one shared height.
    const html = await renderGrid([
      row({ id: "SHORT", room: "Monet", durationMin: 10 }),
      row({ id: "MEDIUM", room: "Piaf", durationMin: 30 }),
      row({ id: "LONG", room: "Debussy", durationMin: 45 }),
    ]);

    const cells = cellsByColumn(html);
    const span = (c: number) => cells.get(c)!.rowEnd - cells.get(c)!.rowStart;
    // All three begin on the same line...
    expect(cells.get(2)!.rowStart).toBe(1);
    expect(cells.get(3)!.rowStart).toBe(1);
    expect(cells.get(4)!.rowStart).toBe(1);
    // ...and end on strictly increasing ones. Equal spans is the old bug.
    expect(span(2)).toBeLessThan(span(3));
    expect(span(3)).toBeLessThan(span(4));
  });

  it("labels each room cell with its room, so the lens can renumber columns", async () => {
    // Asserted through cellsByColumn, not a bare html.toContain: the header
    // row emits a `data-room` per room too (ScheduleGridView.astro's
    // `.grid-view-room`), so a plain substring check on the whole document
    // would pass on the header alone and never touch the body cell this
    // guard exists for.
    const html = await renderGrid([
      row({ id: "A", room: "Monet" }),
      row({ id: "B", room: "Piaf" }),
    ]);
    const cells = cellsByColumn(html);
    expect(cells.get(2)!.room).toBe("Monet");
    expect(cells.get(3)!.room).toBe("Piaf");
  });
});
