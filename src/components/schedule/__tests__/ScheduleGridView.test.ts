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
 */
function cellsByColumn(html: string): Map<number, string> {
  const starts = [
    ...html.matchAll(/<div class="grid-view-cell" style="grid-column:(\d+);"[^>]*>/g),
  ];
  const cells = new Map<number, string>();
  for (let i = 0; i < starts.length; i++) {
    const column = Number(starts[i][1]);
    const from = starts[i].index! + starts[i][0].length;
    const to = i + 1 < starts.length ? starts[i + 1].index! : html.length;
    cells.set(column, html.slice(from, to));
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
    // Exactly one cell per room, one column apiece — nothing merged or lost.
    expect([...cells.keys()].sort()).toEqual([2, 3, 4]);

    // Room[0] (Monet) is column 2, and — since Monet's own session is the
    // keynote, filtered out of room cells — that cell is empty, not merged
    // into the time gutter.
    expect(cells.get(2)).not.toContain("data-session-id");

    // The bug's exact symptom: a talk landing one column left of its room.
    // Room[1] (Piaf) must be in column 3, not smeared into column 2.
    expect(cells.get(3)).toContain('data-session-id="TALK-PIAF"');
    expect(cells.get(2)).not.toContain('data-session-id="TALK-PIAF"');

    // Room[2] (Debussy) must be in column 4, not column 3.
    expect(cells.get(4)).toContain('data-session-id="TALK-DEBUSSY"');
    expect(cells.get(3)).not.toContain('data-session-id="TALK-DEBUSSY"');

    // No room cell ever lands in the 56px time-gutter column.
    expect(cells.has(1)).toBe(false);
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
    expect(cells.get(2)).toContain('data-session-id="A"');
    expect(cells.get(3)).toContain('data-session-id="B"');
    expect(cells.get(4)).toContain('data-session-id="C"');
  });
});
