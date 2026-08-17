/**
 * Asserts the redesign's load-bearing decisions survive into the built HTML.
 * These are the things a refactor could silently undo.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const html = readFileSync("dist/programme/2026/index.html", "utf8");

describe("programme page", () => {
  it("ships a search field", () => {
    expect(html).toMatch(/id="schedule-search"/);
  });

  it("offers both views", () => {
    // Assert the view CONTAINERS, not `data-view="…"` — that attribute is on the
    // toolbar's toggle buttons, which render whether or not the view they switch
    // to still exists.
    expect(html).toMatch(/class="grid-view"/);
    expect(html).toMatch(/class="list-view"/);
  });

  it("renders every session in both views", () => {
    const gridAt = html.indexOf('class="grid-view"');
    const listAt = html.indexOf('class="list-view"');
    expect(gridAt).toBeGreaterThan(-1);
    // Grid is emitted first; the slice below depends on it.
    expect(listAt).toBeGreaterThan(gridAt);

    const idsIn = (s: string) =>
      new Set([...s.matchAll(/data-session-id="([A-Z0-9]{6})"/g)].map((m) => m[1]));

    // Counted PER VIEW. A single `new Set` over the whole page cannot tell 51
    // sessions rendered twice from 51 rendered once, so it stayed green with an
    // entire view deleted.
    expect(idsIn(html.slice(gridAt, listAt)).size).toBe(51);
    expect(idsIn(html.slice(listAt)).size).toBe(51);
  });

  it("labels the breaks instead of leaving empty gaps", () => {
    expect(html).toMatch(/Pause/);
  });

  it("puts no coloured stripe on a card edge", () => {
    // The design decision: track colour lives in the pill, never as an edge.
    expect(html).not.toMatch(/border-left:\s*4px/);
    expect(html).not.toMatch(/border-l-4/);
  });

  it("announces the result count politely", () => {
    expect(html).toMatch(/id="schedule-result-count"[^>]*aria-live="polite"/);
  });
});
